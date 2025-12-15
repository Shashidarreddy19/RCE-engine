const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdtemp = promisify(fs.mkdtemp);
const writeFile = promisify(fs.writeFile);
const rm = promisify(fs.rm || fs.rmdir);
const os = require('os');
const crypto = require('crypto');

// Helpers
function makeId() {
    return Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex');
}

async function createTempRunDir() {
    const tempBasePath = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempBasePath)) {
        fs.mkdirSync(tempBasePath, { recursive: true });
    }
    const base = path.join(tempBasePath, 'rce-');
    const dir = await mkdtemp(base);
    return dir;
}

function languageToFilename(language, classNameFallback = 'Main') {
    switch ((language || '').toLowerCase()) {
        case 'c': return 'main.c';
        case 'cpp':
        case 'c++': return 'main.cpp';
        case 'java': return `${classNameFallback}.java`;
        case 'python': return 'main.py';
        case 'go': return 'main.go';
        case 'nodejs':
        case 'node':
        case 'node.js':
        case 'javascript': return 'main.js';
        default: return 'main.txt';
    }
}

function runCommand(cmd, args, opts = {}, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, opts);
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            try { proc.kill('SIGKILL'); } catch (e) { }
        }, timeoutMs);

        if (proc.stdout) {
            proc.stdout.on('data', d => {
                const chunk = d.toString();
                stdout += chunk;
                if (opts.onOutput) opts.onOutput(chunk);
            });
        }
        if (proc.stderr) {
            proc.stderr.on('data', d => {
                const chunk = d.toString();
                stderr += chunk;
                if (opts.onOutput) opts.onOutput(chunk);
            });
        }

        proc.on('error', err => {
            clearTimeout(timer);
            reject(err);
        });

        proc.on('close', (code, signal) => {
            clearTimeout(timer);
            if (timedOut) return reject(new Error('Execution Timeout'));
            resolve({ code, signal, stdout, stderr });
        });

        // Return process so we can kill it externally if needed
        resolve.proc = proc;
    });
}

module.exports = (socket) => {
    let activeChild = null; // Track active process for this socket
    let activeRunDir = null;

    socket.on("run", async ({ code, language }) => {
        // Kill previous process if any
        if (activeChild) {
            try { activeChild.kill('SIGKILL'); } catch (e) { }
            activeChild = null;
        }
        // Cleanup previous run dir if any (though we usually clean up after run)
        if (activeRunDir && fs.existsSync(activeRunDir)) {
            try { await rm(activeRunDir, { recursive: true, force: true }); } catch (e) { }
            activeRunDir = null;
        }

        let runDir;
        try {
            runDir = await createTempRunDir();
            activeRunDir = runDir;

            // Java Class Name Detection
            let className = 'Main';
            if (language && language.toLowerCase() === 'java') {
                const m = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
                if (m) className = m[1];
            }

            const filename = languageToFilename(language, className);
            const filePath = path.join(runDir, filename);

            await writeFile(filePath, code, { encoding: 'utf8' });

            let runCmd = '';
            let runArgs = [];
            let dockerImage = 'coderunner-multilang'; // Assuming same image for all

            // NOTE: We are running via docker-in-docker or simple docker run. 
            // The previous code used `spawn('docker', ...)`
            // We'll mimic the previous logic but with unique paths.

            // Prepare Docker arguments
            // We need to mount the unique runDir to /app

            let cmdInContainer = '';

            switch ((language || '').toLowerCase()) {
                case 'python':
                    cmdInContainer = `python3 -I -u /app/${filename}`;
                    break;
                case 'javascript':
                case 'node':
                case 'nodejs':
                case 'node.js':
                    cmdInContainer = `node /app/${filename}`;
                    break;
                case 'go':
                    // Unique output binary name
                    cmdInContainer = `cp /app/${filename} /tmp/main.go && cd /tmp && go build -o app.out main.go && ./app.out`;
                    break;
                case 'cpp':
                case 'c++':
                    // Unique binary
                    cmdInContainer = `g++ /app/${filename} -O2 -o /app/a.out && stdbuf -o0 /app/a.out`;
                    break;
                case 'c':
                    cmdInContainer = `gcc /app/${filename} -O2 -o /app/a.out && stdbuf -o0 /app/a.out`;
                    break;
                case 'java':
                    cmdInContainer = `javac /app/${filename} && stdbuf -o0 java -XX:+UseSerialGC -Xss1m -Xms64m -Xmx128m -cp /app ${className}`;
                    break;
                default:
                    socket.emit('output', 'Unsupported language\n');
                    return;
            }

            const dockerArgs = [
                'run',
                '-i',             // Interactive for stdin
                '--rm',
                '--network', 'none',
                '--memory', '256m',
                '--cpus', '2',
                '--ulimit', 'nofile=1024:1024',
                '-v', `${runDir}:/app`,
                dockerImage,
                '/bin/bash', '-c', cmdInContainer
            ];

            // We use our raw spawn logic here effectively, but we want to hook up the socket output
            // The helper runCommand is good for simple async, but here we need streaming to socket.
            // So we'll use a modified approach or just raw spawn but track it properly.

            // Let's use raw spawn to keep streaming simple, but use the unique dir.

            const child = spawn('docker', dockerArgs);
            activeChild = child;

            let timedOut = false;
            const timeoutMs = 15000; // 15s timeout
            const timer = setTimeout(() => {
                timedOut = true;
                if (activeChild === child) {
                    try { child.kill('SIGKILL'); } catch (e) { }
                    socket.emit('output', '\n[Execution Timeout]');
                }
            }, timeoutMs);

            // Input handling
            socket.on('input', (data) => {
                if (activeChild === child && child.stdin) {
                    try { child.stdin.write(data + '\n'); } catch (e) { }
                }
            });

            child.stdout.on('data', (data) => {
                socket.emit('output', data.toString());
            });
            child.stderr.on('data', (data) => {
                socket.emit('output', data.toString());
            });

            child.on('close', async () => {
                clearTimeout(timer);
                if (activeChild === child) activeChild = null;

                if (!timedOut) socket.emit('output', '\n[Program exited]');

                // Cleanup
                try {
                    await rm(runDir, { recursive: true, force: true });
                } catch (e) {
                    console.error('cleanup error', e);
                }
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                socket.emit('output', `\n[System Error: ${err.message}]`);
            });

        } catch (err) {
            socket.emit('output', `\n[Internal Error: ${err.message}]`);
            // Cleanup if we failed before spawning
            if (runDir && fs.existsSync(runDir)) {
                try { await rm(runDir, { recursive: true, force: true }); } catch (e) { }
            }
        }
    });

    socket.on('disconnect', () => {
        if (activeChild) {
            try { activeChild.kill('SIGKILL'); } catch (e) { }
            activeChild = null;
        }
        if (activeRunDir && fs.existsSync(activeRunDir)) {
            // Attempt async cleanup
            rm(activeRunDir, { recursive: true, force: true }).catch(() => { });
        }
    });
};