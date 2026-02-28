import { Namespace } from "socket.io";
import { createInitialBoard, getValidMoves, applyMove, canMove, countPieces, Board, Player, GameStatus, ReversiHistoryRecordServer } from "../lib/ReversiLogic";

let board = createInitialBoard();
let gameStatus: GameStatus = "Black";
let lastMoveIndex: number | null = null;
let passPlayer: Player | null = null;
let isGameOver: boolean = false;
let scores = countPieces(board);
let validMoves = getValidMoves(board, gameStatus);
let historyRecord: ReversiHistoryRecordServer[] = [{ board, previousMove: null, passPlayer: null, gameStatus, scores }];
let canGoBack: boolean = false;
let canGoForward: boolean = false;
let currentStep: number = 0;

export const reversiHandler = (ns: Namespace) => {
	ns.on('connection', (socket) => {
		console.log(`[Reversi] Client connected: ${socket.id}`);

		const broadcastCurrentState = () => {
			ns.emit('gameState', { board, lastMoveIndex, passPlayer, gameStatus, validMoves, scores, canGoBack, canGoForward });
		};

		broadcastCurrentState();

		const handleReset = () => {
			board = createInitialBoard();
			gameStatus = "Black";
			lastMoveIndex = null;
			passPlayer = null;
			isGameOver = false;
			scores = countPieces(board);
			validMoves = getValidMoves(board, gameStatus);
			historyRecord = [{ board, previousMove: null, passPlayer: null, gameStatus, scores }];
			canGoBack = false;
			canGoForward = false;
			currentStep = 0;
			broadcastCurrentState();
		};

		const handleChangeStep = (nextStep: number) => {
			if (!isGameOver || nextStep < 0 || nextStep >= historyRecord.length) {
				return;
			}
			currentStep = nextStep;
			const record = historyRecord[currentStep];
			board = record.board;
			gameStatus = record.gameStatus;
			lastMoveIndex = record.previousMove ? record.previousMove.index : null;
			passPlayer = record.passPlayer;
			validMoves = [];
			scores = record.scores;
			canGoBack = currentStep > 0;
			canGoForward = currentStep < historyRecord.length - 1;
			broadcastCurrentState();
		};

		socket.on('makeMove', (index: number) => {
			if (!validMoves.includes(index) || isGameOver || gameStatus === "GameOver") {
				return;
			}
			passPlayer = null;
			const currentPlayer: Player = gameStatus;
			board = applyMove(board, { index, player: currentPlayer });
			lastMoveIndex = index;
			const nextPlayer: GameStatus = currentPlayer === "Black" ? "White" : "Black";
			if (canMove(board, nextPlayer)) {
				gameStatus = nextPlayer;
			} else if (canMove(board, currentPlayer)) {
				passPlayer = nextPlayer;
				gameStatus = currentPlayer;
			} else {
				gameStatus = "GameOver";
				isGameOver = true;
				currentStep = historyRecord.length;
				canGoBack = true;
				canGoForward = false;
			}
			validMoves = gameStatus === "GameOver" ? [] : getValidMoves(board, gameStatus);
			scores = countPieces(board);
			historyRecord.push({ board, previousMove: { index, player: currentPlayer }, passPlayer, gameStatus, scores });
			broadcastCurrentState();
		});

		socket.on('goToStart', () => {
			handleChangeStep(0);
		});

		socket.on('goBack', () => {
			handleChangeStep(currentStep - 1);
		});

		socket.on('goForward', () => {
			handleChangeStep(currentStep + 1);
		});

		socket.on('goToEnd', () => {
			handleChangeStep(historyRecord.length - 1);
		});

		socket.on('resetGame', () => {
			handleReset();
		});

		socket.on('disconnect', () => {
			console.log(`[Reversi] Client disconnected: ${socket.id}`);
		});
	});
};
