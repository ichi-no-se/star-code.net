"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN || ' http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});
let timeLimit = 15 * 1000;
let messages = [];
io.on('connection', (socket) => {
    io.emit('userCount', io.engine.clientsCount);
    console.log(`Client connected: ${socket.id}`);
    socket.emit('newMessages', messages);
    socket.on('sendMessage', (text) => {
        messages.push({
            text,
            timestamp: Date.now()
        });
        io.emit('newMessages', messages);
    });
    socket.on('disconnect', () => {
        io.emit('userCount', io.engine.clientsCount);
        console.log(`Client disconnected: ${socket.id}`);
    });
});
setInterval(() => {
    messages = messages.filter(m => Date.now() - m.timestamp <= timeLimit);
    io.emit('newMessages', messages);
}, 1000);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
