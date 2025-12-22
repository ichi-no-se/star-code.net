import { Namespace } from "socket.io";

interface ChatMessage {
	text: string;
	timestamp: number;
}


let timeLimit = 15 * 1000;
let messages: ChatMessage[] = [];

export const chatHandler = (io: Namespace) => {
	io.on('connection', (socket) => {
		io.emit('userCount', io.sockets.size);
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
			io.emit('userCount', io.sockets.size);
			console.log(`Client disconnected: ${socket.id}`);
		});
	});

	setInterval(() => {
		messages = messages.filter(m => Date.now() - m.timestamp <= timeLimit);
		io.emit('newMessages', messages);
	}, 1000);
}