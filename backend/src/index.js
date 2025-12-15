const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const compilerRoutes = require('./routes/compiler');
const snippetRoutes = require('./routes/snippets');

const http = require('http');
const { Server } = require("socket.io");
const socketHandler = require('./socket/handler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this dev environment
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/snippets', snippetRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io
io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    socketHandler(socket);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
