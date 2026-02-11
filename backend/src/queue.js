const { Queue } = require('bullmq');
const dotenv = require('dotenv');

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

const jobQueue = new Queue('job-queue', { connection });

module.exports = { jobQueue, connection };
