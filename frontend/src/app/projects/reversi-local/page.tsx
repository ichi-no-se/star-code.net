"use client"
import { useState, useMemo, useRef} from "react"
import { createInitialBoard, getValidMoves, applyMove, canMove, countPieces, Board, Player, GameStatus, ReversiHistoryRecord } from "@/lib/ReversiLogic"
import { ReversiBoard } from "@/components/Reversi/ReversiBoard";
import { ReversiScoreBoard } from "@/components/Reversi/ReversiScoreBoard";
import { ReversiControlls } from "@/components/Reversi/ReversiControlls";
import "@styles/reversi.css";

export default function ReversiLocalPage() {
	const [board, setBoard] = useState<Board>(createInitialBoard());
	const [gameStatus, setGameStatus] = useState<GameStatus>("Black");
	const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
	const [passPlayer, setPassPlayer] = useState<Player | null>(null);
	const [isGameOver, setIsGameOver] = useState<boolean>(false);
	const [step, setStep] = useState<number>(0);
	const validMoves = useMemo(() => {
		if (isGameOver || gameStatus === "GameOver") {
			return [];
		}
		return getValidMoves(board, gameStatus);
	}, [board, gameStatus, isGameOver]);

	const scores = useMemo(() => countPieces(board), [board]);
	const historyRecordRef = useRef<ReversiHistoryRecord[]>([{ board, previousMove: null, passPlayer: null, gameStatus: "Black" }]);
	const handleCellClick = (index: number) => {
		if (!validMoves.includes(index) || isGameOver || gameStatus === "GameOver") {
			return;
		}
		setPassPlayer(null);
		const currentPlayer: Player = gameStatus;
		const newBoard = applyMove(board, { index, player: currentPlayer });
		setBoard(newBoard);
		setLastMoveIndex(index);
		const nextPlayer: GameStatus = currentPlayer === "Black" ? "White" : "Black";
		let nextPassPlayer: Player | null = null;
		let nextGameStatus: GameStatus = nextPlayer;
		if (canMove(newBoard, nextPlayer)) {
			nextGameStatus = nextPlayer;
		} else if (canMove(newBoard, currentPlayer)) {
			nextPassPlayer = nextPlayer;
			nextGameStatus = currentPlayer;
		} else {
			nextGameStatus = "GameOver";
			setStep(historyRecordRef.current.length);
			setIsGameOver(true);
		}
		setPassPlayer(nextPassPlayer);
		setGameStatus(nextGameStatus);
		historyRecordRef.current.push({ board: newBoard, previousMove: { index, player: currentPlayer }, passPlayer: nextPassPlayer, gameStatus: nextGameStatus });
	}

	const handleReset = () => {
		setBoard(createInitialBoard());
		setGameStatus("Black");
		setLastMoveIndex(null);
		setPassPlayer(null);
		historyRecordRef.current = [{ board: createInitialBoard(), previousMove: null, passPlayer: null, gameStatus: "Black" }];
		setStep(0);
		setIsGameOver(false);
	}

	const handleChangeStep = (nextStep: number) => {
		setBoard(historyRecordRef.current[nextStep].board);
		setGameStatus(historyRecordRef.current[nextStep].gameStatus);
		const previousMove = historyRecordRef.current[nextStep].previousMove;
		setLastMoveIndex(previousMove ? previousMove.index : null);
		setPassPlayer(historyRecordRef.current[nextStep].passPlayer);
	}

	const handleGoToStart = () => {
		setStep(0);
		handleChangeStep(0);
	}
	const handleGoBack = () => {
		if (step > 0) {
			setStep(step - 1);
			handleChangeStep(step - 1);
		}
	}
	const handleGoForward = () => {
		if (step < historyRecordRef.current.length - 1) {
			setStep(step + 1);
			handleChangeStep(step + 1);
		}
	}
	const handleGoToEnd = () => {
		setStep(historyRecordRef.current.length - 1);
		handleChangeStep(historyRecordRef.current.length - 1);
	}

	const canGoForward = isGameOver && (step < historyRecordRef.current.length - 1);
	const canGoBack = isGameOver && (step > 0);

	return (
		<main>
			<h1 className="title">リバーシ（シンプル）</h1>
			<h2 className="introduction">
				ブラウザ上で動作するシンプルなリバーシ盤面．<br />
				一人二役もよし，誰かと同じ PC で対戦もよし．<br />
			</h2>
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