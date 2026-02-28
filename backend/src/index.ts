import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { chatHandler } from './handlers/chat';
import { reversiHandler } from './handlers/reversi';
import { onlineGamePrototype0Handler } from './handlers/online-game-prototype-0';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_ORIGIN || ' http://localhost:3000',
		methods: ['GET', 'POST'],
	}
});

const chatNamespace = io.of('/chat');
chatHandler(chatNamespace);

const reversiNamespace = io.of('/reversi');
reversiHandler(reversiNamespace);

const onlineGamePrototype0Namespace = io.of('/online-game-prototype-0');
onlineGamePrototype0Handler(onlineGamePrototype0Namespace);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
