const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}



const cleanWorkspace = () => {
    const files = ["main.py", "Main.java", "main.cpp", "main.c", "main.go", "main.js", "app.out", "a.out", "output", "Main.class"];
    files.forEach(f => {
        const filePath = path.join(path.join(__dirname, '../../temp/active_run'), f);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (err) { }
        }
    });
};

module.exports = (socket) => {
    let child = null;
    let jobDir = null; // Will point to active_run
    let inactivityTimer = null;
    const INACTIVITY_LIMIT = 100000; // 100s of NO activity → kill

    function resetTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (child) {
                try { child.kill(); } catch (e) { }
                socket.emit('output', '\n[Execution Timeout]');
            }
        }, INACTIVITY_LIMIT);
    }

    socket.on("run", async ({ code, language }) => {
        // 🔥 KILL PREVIOUS PROCESS IF RUNNING
        if (child) {
            try {
                child.stdout.removeAllListeners();
                child.stderr.removeAllListeners();
                child.removeAllListeners();
                child.kill();
            } catch (e) { }
            child = null;
        }

        cleanWorkspace();   // 🔥 resets environment before each execution

        // Set stable job directory
        jobDir = path.join(tempDir, 'active_run');
        if (!fs.existsSync(jobDir)) {
            fs.mkdirSync(jobDir, { recursive: true });
        }


        try {
            let filename;
            let runCmd = '/bin/bash';
            let runArgs = [];
            let dockerImage;
            let envArgs = [];

            switch (language) {
                case 'python': {
                    filename = 'main.py';
                    dockerImage = "coderunner-multilang";
                    runArgs = ['-c', `python3 -I -u /app/${filename}`];
                    break;
                }

                case "javascript":
                case "node":
                case "Node.js": {
                    filename = "main.js";
                    dockerImage = "coderunner-multilang";
                    runArgs = ["-c", `node /app/${filename}`];
                    break;
                }

                case 'go': {
                    filename = 'main.go';
                    dockerImage = "coderunner-multilang";
                    runArgs = [
                        '-c',
                        `cp /app/${filename} /tmp/main.go && cd /tmp && go build -o output main.go && ./output`
                    ];
                    envArgs = [];
                    break;
                }

                // 🔥 C++ WITH DISABLED BUFFERING
                case 'cpp': {
                    filename = 'main.cpp';
                    dockerImage = "coderunner-multilang";
                    const outFile = `/app/output_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                    runArgs = [
                        '-c',
                        `g++ /app/${filename} -O2 -o ${outFile} && stdbuf -o0 ${outFile} && rm ${outFile}`
                    ];
                    break;
                }

                // 🔥 C WITH DISABLED BUFFERING
                case 'c': {
                    filename = 'main.c';
                    dockerImage = "coderunner-multilang";
                    const outFile = `/app/output_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                    runArgs = [
                        '-c',
                        `gcc /app/${filename} -O2 -o ${outFile} && stdbuf -o0 ${outFile} && rm ${outFile}`
                    ];
                    break;
                }

                case 'java': {
                    // Strip package declarations
                    code = code.replace(/^\s*package\s+[\w.]+;/gm, '');

                    // Detect class name
                    const classMatch =
                        code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/) ||
                        code.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
                    const className = classMatch ? classMatch[1] : 'Main';

                    filename = `${className}.java`;
                    dockerImage = "coderunner-multilang";

                    runArgs = [
                        '-c',
                        `javac /app/${filename} && ` +
                        `stdbuf -o0 java -XX:+UseSerialGC -Xss1m -Xms64m -Xmx128m -cp /app ${className}`
                    ];
                    break;
                }

                default: {
                    socket.emit('output', 'Unsupported language\n');
                    return;
                }
            }

            // Write code file
            const filePath = path.join(jobDir, filename);
            fs.writeFileSync(filePath, code);

            // Docker sandbox args
            const dockerArgs = [
                'run',
                '-i',
                '--rm',
                '--network', 'none',
                '--memory', '256m',
                '--cpus', '2',
                '--pids-limit', '200',
                '--ulimit', 'nofile=1024:1024',
                '--ulimit', 'stack=8388608:8388608',
                '-v', `${jobDir}:/app`,
                '-e', 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                ...envArgs,
                dockerImage,
                runCmd,
                ...runArgs
            ];

            child = spawn('docker', dockerArgs, { cwd: __dirname });

            // Start inactivity timer as soon as the process is running
            resetTimer();

            child.stdout.on('data', (data) => {
                resetTimer();   // got output → still alive
                socket.emit('output', data.toString());
            });

            child.stderr.on('data', (data) => {
                resetTimer();   // got error output → still alive
                socket.emit('output', data.toString());
            });

            // When program exits
            child.on('close', () => {
                try { child.stdin.end(); } catch (e) { }
                socket.emit('output', '\n[Program exited]');
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
                child = null;
                // clean up
                if (jobDir && fs.existsSync(jobDir)) {
                    try {
                        fs.rmSync(jobDir, { recursive: true, force: true });
                    } catch (e) { }
                }
            });

            child.on('error', (err) => {
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
                socket.emit('output', `\n[System Error: ${err.message}]`);
            });
        } catch (err) {
            socket.emit('output', `\n[Internal Server Error: ${err.message}]`);
        }
    });

    socket.on('input', (data) => {
        if (child && child.stdin) {
            try {
                resetTimer();    // user just interacted
                child.stdin.write(data + '\n');
            } catch (e) { }
        }
    });

    socket.on('disconnect', () => {
        if (child) {
            try { child.kill(); } catch (e) { }
            child = null;
        }
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        if (jobDir && fs.existsSync(jobDir)) {
            try {
                fs.rmSync(jobDir, { recursive: true, force: true });
            } catch (e) { }
        }
    });
};