"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import '@styles/chat.css'

interface ChatMessage {
	text: string;
	timestamp: number;
}

export default function Chat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [message, setMessage] = useState<string>('');
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const [isAtBottom, setIsAtBottom] = useState(true);
	const [userCount, setUserCount] = useState<number>(0);

	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/chat';
		const socket = io(url);
		socketRef.current = socket;


		socket.on('newMessages', (messages: ChatMessage[]) => {
			setMessages(messages);
		});

		socket.on('userCount', (count: number) => {
			setUserCount(count);
		});

		return () => {
			socket.off('newMessages');
			socket.off('userCount');
			socket.disconnect();
		}
	}, []);

	const sendMessage = () => {
		if (message.trim() !== '' && socketRef.current) {
			socketRef.current.emit('sendMessage', message);
			setMessage('');
		}
	};

	useEffect(() => {
		if (chatContainerRef.current && isAtBottom) {
			chatContainerRef.current?.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: 'auto',
			});
		}
	}, [messages, isAtBottom]);

	useEffect(() => {
		if (isAtBottom) {
			chatContainerRef.current?.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: 'auto',
			});
		}
	}, [messages, isAtBottom]);

	const handleScroll = () => {
		if (chatContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
			setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 20);
		}
	};

	return (
		<>
			<h1 className="title">15 秒チャット </h1>
			<h2 className="introduction">
				15 秒でメッセージが消えるチャット，詳細は<Link href="/blog/15sec-chat">こちら</Link>から
			</h2>
			<div className="user-count">
				<p>現在のユーザー数: {userCount}</p>
			</div>
			<div className="chat-container" ref={chatContainerRef} onScroll={handleScroll}>
				{messages.map((msg, i) => (
					<div key={i} className="chat-message">
						<p>{msg.text}</p>
					</div>
				))}
			</div>
			<div className="input-container">
				<input type="text" value={message}
					placeholder="メッセージを入力"
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							sendMessage();
						}
					}}
					className="chat-input"
				/>
				<button onClick={sendMessage} className="chat-send-button">送信</button>
			</div>
		</>
	)
}
