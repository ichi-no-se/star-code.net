import { Namespace } from "socket.io";

interface ChatMessage {
	text: string;
	timestamp: number;
}


let timeLimit = 15 * 1000;
let messages: ChatMessage[] = [];

export const chatHandler = (ns: Namespace) => {
	ns.on('connection', (socket) => {
		ns.emit('userCount', ns.sockets.size);
		console.log(`[Chat] Client connected: ${socket.id}`);
		socket.emit('newMessages', messages);
		socket.on('sendMessage', (text) => {
			messages.push({
				text,
				timestamp: Date.now()
			});
			ns.emit('newMessages', messages);
		});
		socket.on('disconnect', () => {
			ns.emit('userCount', ns.sockets.size);
			console.log(`[Chat] Client disconnected: ${socket.id}`);
		});
	});

	setInterval(() => {
		messages = messages.filter(m => Date.now() - m.timestamp <= timeLimit);
		ns.emit('newMessages', messages);
	}, 1000);
}
