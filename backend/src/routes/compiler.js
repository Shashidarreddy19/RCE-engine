// src/routes/compiler.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid'); // works with uuid v8.x
const router = express.Router();

const TEMP_ROOT = path.resolve(__dirname, '../../temp'); // make sure this exists and is writeable

// helper to run a command with timeout and promise
function runCommand(cmd, args, opts = {}) {
    const timeoutMs = opts.timeout || 8000;
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], ...opts.spawnOptions });

        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            try { child.kill('SIGKILL'); } catch (e) { }
            stderr += `\n[Execution Timeout after ${timeoutMs}ms]`;
        }, timeoutMs);

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });

        child.on('close', (code, signal) => {
            clearTimeout(timer);
            if (timedOut) {
                return reject(new Error(stderr || 'Timed out'));
            }
            resolve({ code, signal, stdout, stderr });
        });
    });
}

router.post('/compile', async (req, res) => {
    // expected body: { language, code }
    const { language, code } = req.body || {};
    if (!language || !code) return res.status(400).json({ error: 'language and code required' });

    const jobId = uuidv4();
    const workdir = path.join(TEMP_ROOT, jobId);
    try {
        fs.mkdirSync(workdir, { recursive: true, mode: 0o777 });
        // safe filename mapping per language
        let srcName, compileCmd, runCmd;
        if (language === 'c') {
            srcName = 'main.c';
            compileCmd = ['gcc', srcName, '-o', 'a.out'];
            runCmd = ['./a.out'];
        } else if (language === 'cpp') {
            srcName = 'main.cpp';
            compileCmd = ['g++', srcName, '-o', 'a.out'];
            runCmd = ['./a.out'];
        } else if (language === 'java') {
            srcName = 'Main.java';
            compileCmd = ['javac', srcName];
            runCmd = ['java', 'Main'];
        } else if (language === 'python') {
            srcName = 'main.py';
            compileCmd = null;
            runCmd = ['python3', srcName];
        } else {
            return res.status(400).json({ error: 'Unsupported language' });
        }

        const srcPath = path.join(workdir, srcName);
        fs.writeFileSync(srcPath, code, { mode: 0o666 });

        // compile if needed
        if (compileCmd) {
            // run compile inside workdir
            const compileResult = await runCommand(compileCmd[0], compileCmd.slice(1), { spawnOptions: { cwd: workdir }, timeout: 10000 });
            if (compileResult.code !== 0) {
                // return compile error
                return res.json({ success: false, compileOutput: compileResult.stderr || compileResult.stdout });
            }
        }

        // run program with safe timeout
        const runResult = await runCommand(runCmd[0], runCmd.slice(1), { spawnOptions: { cwd: workdir }, timeout: 8000 });
        res.json({
            success: true,
            stdout: runResult.stdout,
            stderr: runResult.stderr,
            exitCode: runResult.code,
        });
    } catch (err) {
        console.error('Compile/run error', err);
        res.json({ success: false, error: String(err.message || err) });
    } finally {
        // try cleanup, swallow errors
        try {
            // remove workdir recursively
            fs.rmSync(workdir, { recursive: true, force: true });
        } catch (e) {
            // ignore
            console.warn('Failed to cleanup', workdir, e && e.message);
        }
    }
});

module.exports = router;
