export type Player = "Black" | "White";
export type GameStatus = Player | "GameOver";
export type CellState = Player | "Empty";
export type Board = CellState[];
export type Move = { index: number, player: Player };
export type ReversiHistoryRecord = { board: Board, previousMove: Move | null, passPlayer: Player | null, gameStatus: GameStatus };
export type ReversiHistoryRecordServer = ReversiHistoryRecord & { scores: { Black: number, White: number } };

export const BOARD_SIZE = 8;
export const DIRECTIONS: number[][] = [
	[-1, -1], [-1, 0], [-1, 1],
	[0, -1], [0, 1],
	[1, -1], [1, 0], [1, 1],
];

export function toXY(index: number): { x: number, y: number } {
	return { x: index & 7, y: index >> 3 };
}

export function toIndex(x: number, y: number): number {
	return (y << 3) | x;
}

export function getOpponent(player: Player): Player {
	return player === "Black" ? "White" : "Black";
}

export function createInitialBoard(): Board {
	const board: Board = new Array(BOARD_SIZE * BOARD_SIZE).fill("Empty");
	board[toIndex(3, 3)] = "White";
	board[toIndex(4, 4)] = "White";
	board[toIndex(3, 4)] = "Black";
	board[toIndex(4, 3)] = "Black";
	return board;
}

export function getFlippableStones(board: Board, move: Move): number[] {
	const { index, player } = move;
	if (board[index] !== "Empty") {
		return [];
	}
	const opponent = getOpponent(player);
	const flippableStones: number[] = [];
	const { x, y } = toXY(index);
	for (const [dx, dy] of DIRECTIONS) {
		let nx = x + dx;
		let ny = y + dy;
		const potentialFlips: number[] = [];
		while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
			const cell = board[toIndex(nx, ny)];
			if (cell === opponent) {
				potentialFlips.push(toIndex(nx, ny));
			} else if (cell === player) {
				flippableStones.push(...potentialFlips);
				break;
			} else {
				break;
			}
			nx += dx;
			ny += dy;
		}
	}
	return flippableStones;
}

export function isValidMove(board: Board, move: Move): boolean {
	const flippableStones = getFlippableStones(board, move);
	return flippableStones.length > 0;
}

export function getValidMoves(board: Board, player: Player): number[] {
	const validMoves: number[] = [];
	for (let index = 0; index < board.length; index++) {
		const move: Move = { index, player };
		if (isValidMove(board, move)) {
			validMoves.push(index);
		}
	}
	return validMoves;
}

export function applyMove(board: Board, move: Move): Board {
	const flippableStones = getFlippableStones(board, move);
	if (flippableStones.length === 0) {
		return board;
	}
	const newBoard = [...board];
	newBoard[move.index] = move.player;
	for (const index of flippableStones) {
		newBoard[index] = move.player;
	}
	return newBoard;
}

export function countPieces(board: Board): { Black: number, White: number } {
	let blackCount = 0;
	let whiteCount = 0;
	for (const cell of board) {
		if (cell === "Black") {
			blackCount++;
		} else if (cell === "White") {
			whiteCount++;
		}
	}
	return { Black: blackCount, White: whiteCount };
}

export function canMove(board: Board, turn: Player): boolean {
	const validMoves = getValidMoves(board, turn);
	return validMoves.length > 0;
}

export function isGameOver(board: Board): boolean {
	return !canMove(board, "Black") && !canMove(board, "White");
}
