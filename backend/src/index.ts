import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_ORIGIN ||' http://localhost:3000',
		methods: ['GET', 'POST'],
	}
});

interface ChatMessage{
	text: string;
	timestamp: number;
}

let timeLimit = 15 * 1000;
let messages: ChatMessage[] = [];

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
