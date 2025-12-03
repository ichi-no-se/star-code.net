"use client"
import Link from "next/link"
import { io, Socket } from 'socket.io-client'
import { useState, useEffect, useRef} from "react"
import { createInitialBoard,Board, Player, GameStatus, } from "@/lib/ReversiLogic"
import { ReversiBoard } from "@/components/Reversi/ReversiBoard";
import { ReversiScoreBoard } from "@/components/Reversi/ReversiScoreBoard";
import { ReversiControlls } from "@/components/Reversi/ReversiControlls";
import "@styles/reversi.css";



export default function ReversiGlobalPage() {
	const [board, setBoard] = useState<Board>(createInitialBoard());
	const [validMoves, setValidMoves] = useState<number[]>([]);
	const [gameStatus, setGameStatus] = useState<GameStatus>("Black");
	const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
	const [passPlayer, setPassPlayer] = useState<Player | null>(null);
	const [scores, setScores] = useState<{ Black: number, White: number }>({ Black: 2, White: 2 });
	const [canGoBack, setCanGoBack] = useState<boolean>(false);
	const [canGoForward, setCanGoForward] = useState<boolean>(false);
	const [isConnected, setIsConnected] = useState<boolean>(false);

	const socketRef = useRef<Socket|null>(null);

	useEffect(() => {
		const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/reversi';
		const socket = io(url);
		socketRef.current = socket;

		socket.on('connect', () => {
			setIsConnected(true);
			console.log(`Connected to Reversi server`);
		});

		socket.on('disconnect', () => {
			setIsConnected(false);
			console.log(`Disconnected from Reversi server`);
		});

		socket.on('gameState', (data) => {
			setBoard(data.board);
			setLastMoveIndex(data.lastMoveIndex);
			setPassPlayer(data.passPlayer);
			setGameStatus(data.gameStatus);
			setValidMoves(data.validMoves);
			setScores(data.scores);
			setCanGoBack(data.canGoBack);
			setCanGoForward(data.canGoForward);
		});

		return () => {
			socket.off('connect');
			socket.off('disconnect');
			socket.off('gameState');
			socket.disconnect();
		}
	}, [])

	const handleCellClick = (index: number) => {
		socketRef.current?.emit('makeMove', index);
	};
	const handleGoBack = () => {
		socketRef.current?.emit('goBack');
	};
	const handleGoToStart = () => {
		socketRef.current?.emit('goToStart');
	};
	const handleGoForward = () => {
		socketRef.current?.emit('goForward');
	};
	const handleGoToEnd = () => {
		socketRef.current?.emit('goToEnd');
	};
	const handleReset = () => {
		socketRef.current?.emit('resetGame');
	}

	return (
		<main>
			<h1 className="title">全世界同期リバーシ</h1>
			<h2 className="introduction">
				この盤面は全ての閲覧者とリアルタイムで共有されています．<br />
				
				関連記事は<Link href="/blog/reversi-global">こちら</Link>から．
			</h2>
			<div className={`online-status ${isConnected ? 'connected' : 'disconnected'}`}>
				{isConnected ? `⚫︎Online` : `⚫︎Offline (Connecting...)`}
			</div>
			<div className="game-container">
				<div className="board-container">
					<ReversiBoard board={board} validMoves={validMoves} nextTurn={gameStatus} lastMoveIndex={lastMoveIndex} onCellClick={handleCellClick} />
				</div>
				<div className="info-panel">
					<ReversiScoreBoard blackScore={scores.Black} whiteScore={scores.White} gameStatus={gameStatus} passPlayer={passPlayer} />
					<ReversiControlls
						canGoBack={canGoBack}
						onGoBack={handleGoBack}
						onGoToStart={handleGoToStart}
						canGoForward={canGoForward}
						onGoForward={handleGoForward}
						onGoToEnd={handleGoToEnd}
					/>
					<button onClick={handleReset} className="reversi-controlls-button">
						Reset
					</button>
				</div>
			</div>
		</main>
	)
}