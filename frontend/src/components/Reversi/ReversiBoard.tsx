import "@styles/reversi.css";
import { Board, CellState, GameStatus } from "../../lib/ReversiLogic";

type ReversiBoardProps = {
	board: Board;
	onCellClick?: (index: number) => void;
	validMoves?: number[];
	nextTurn?: GameStatus;
	lastMoveIndex?: number | null;
};

export const ReversiBoard = ({ board, onCellClick, validMoves = [], nextTurn, lastMoveIndex }: ReversiBoardProps) => {
	return (
		<div className="reversi-board">
			{board.map((cellState: CellState, index: number) => (
				<div
					key={index}
					className="reversi-cell"
					onClick={() => onCellClick?.(index)}
				>
					{nextTurn && nextTurn !== "GameOver" && validMoves.includes(index) && <div className={`reversi-guide ${String(nextTurn).toLowerCase()}`} />}
					{cellState === "Black" && <div className="reversi-stone black-stone" />}
					{cellState === "White" && <div className="reversi-stone white-stone" />}
					{index === lastMoveIndex && <div className="reversi-last-move-indicator" />}
				</div>
			))}
		</div>
	);
};