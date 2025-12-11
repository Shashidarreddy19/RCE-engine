const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const Submission = require('./models/Submission');
const connectDB = require('./db');

dotenv.config();

// Connect to Database
connectDB();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}


const TIMEOUT = 15000; // 15 seconds
const MAX_OUTPUT = 200 * 1024; // 200 KB

const executeDocker = (language, jobDir, filename, input) => {
    return new Promise((resolve, reject) => {
        let dockerImage = '';
        let cmd = '';

        // Docker volume mount path
        // On Windows host, absolute path works with Docker Desktop
        const mountPath = jobDir;

        // Input redirection part (only if input is provided)
        // We assume input.txt exists in /app if input is provided
        const inputFile = '/app/input.txt';
        const inputRedirect = input ? ` < ${inputFile}` : '';

        let extraArgs = [];

        switch (language) {
            case 'python':
                dockerImage = 'python:3.9-alpine';
                cmd = `sh -c "python /app/${filename}${inputRedirect}"`;
                break;
            case 'javascript':
                dockerImage = 'node:18-alpine';
                cmd = `sh -c "node /app/${filename}${inputRedirect}"`;
                break;
            case 'cpp':
                dockerImage = 'gcc:latest';
                // Compile and run
                cmd = `sh -c "g++ /app/${filename} -o /app/output && /app/output${inputRedirect}"`;
                break;
            case 'c':
                dockerImage = 'gcc:latest';
                cmd = `sh -c "gcc /app/${filename} -o /app/output && /app/output${inputRedirect}"`;
                break;
            case 'java':
                // Using eclipse-temurin as openjdk:17-alpine is deprecated/problematic
                dockerImage = 'eclipse-temurin:17-jdk-alpine';
                // Java matches class Main
                cmd = `sh -c "javac /app/Main.java && java -cp /app Main${inputRedirect}"`;
                break;
            case 'go':
                dockerImage = 'golang:alpine';
                cmd = `sh -c "go run /app/${filename}${inputRedirect}"`;
                // Fix for Go runtime thread creation error in restricted capability container
                extraArgs = ['-e', 'GOMAXPROCS=1', '-e', 'GODEBUG=asyncpreemptoff=1'];
                break;
            default:
                return reject(new Error(`Unsupported language: ${language}`));
        }

        // Common Docker args for security
        // --network none: no internet
        // --memory 128m: max memory
        // --cpus 0.5: max cpu
        // --rm: remove container after run
        // -v: mount volume
        const dockerArgs = [
            'run',
            '--rm',
            '--network', 'none',
            '--memory', '128m',
            '--cpus', '0.5',
            '--pids-limit', '10',
            ...extraArgs,
            '-v', `"${mountPath}:/app"`,
            dockerImage,
            cmd
        ].join(' ');

        console.log(`Executing: docker ${dockerArgs}`);

        // We use exec to run the docker command on the host
        const child = exec(`docker ${dockerArgs}`, { timeout: TIMEOUT }, (error, stdout, stderr) => {
            if (error) {
                // Check for timeout
                if (error.signal === 'SIGTERM' || error.killed) {
                    return resolve({
                        output: '',
                        error: 'Execution Timed Out (Limit: 15s)',
                        status: 'timeout'
                    });
                }
                // Other errors (like compilation error in container, it typically goes to stderr but exit code is non-zero)
                // If the container ran but code failed, stderr should have it. 
                // If docker command itself failed, error.message has it.
                return resolve({
                    output: stdout.slice(0, MAX_OUTPUT),
                    error: (stderr || error.message).slice(0, MAX_OUTPUT),
                    status: 'error'
                });
            }
            resolve({
                output: stdout.slice(0, MAX_OUTPUT),
                error: stderr.slice(0, MAX_OUTPUT),
                status: 'completed'
            });
        });
    });
};

const worker = new Worker('job-queue', async (job) => {
    const { jobId, language, code, input } = job.data;
    console.log(`Processing job ${jobId} (${language})`);

    try {
        const submission = await Submission.findOne({ jobId });
        if (!submission) {
            console.error('Submission not found in DB');
            return;
        }

        submission.status = 'running';
        submission.startedAt = new Date();
        await submission.save();

        // Create job-specific temp dir
        const jobDir = path.join(tempDir, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        // Write code file
        let filename;
        switch (language) {
            case 'python': filename = 'main.py'; break;
            case 'javascript': filename = 'main.js'; break;
            case 'cpp': filename = 'main.cpp'; break;
            case 'c': filename = 'main.c'; break;
            case 'java': filename = 'Main.java'; break;
            case 'go': filename = 'main.go'; break;
            default: filename = 'file.txt';
        }

        fs.writeFileSync(path.join(jobDir, filename), code);

        // Handle Input
        if (input) {
            fs.writeFileSync(path.join(jobDir, 'input.txt'), input);
        }

        const startTime = Date.now();
        const result = await executeDocker(language, jobDir, filename, input);
        const endTime = Date.now();

        // Cleanup
        try {
            fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {
            console.error('Cleanup error:', e);
        }

        // Update DB
        submission.output = result.output;
        submission.error = result.error;
        submission.status = result.status; // 'completed', 'error', 'timeout'
        submission.executionTime = (endTime - startTime).toFixed(2) + 'ms';
        submission.completedAt = new Date();

        await submission.save();
        console.log(`Job ${jobId} finished: ${submission.status}`);

    } catch (err) {
        console.error('Worker error:', err);
        // Try update status
        try {
            await Submission.findOneAndUpdate({ jobId }, {
                status: 'error',
                error: 'Internal Logic Error: ' + err.message
            });
        } catch (e) { }
    }
}, { connection });

worker.on('completed', job => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with ${err.message}`);
});

console.log('Worker started, listening for jobs...');
