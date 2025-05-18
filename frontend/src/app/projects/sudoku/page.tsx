"use client";
import { useState } from "react";
import { SudokuSolver } from "@/lib/SudokuSolver";
import "@styles/sudoku.css";

export default function SudokuPage() {
	const [board, setBoard] = useState<number[][]>(
		Array.from({ length: 9 }, () => Array(9).fill(0))
	);
	const handleChange = (row: number, col: number, value: string) => {
		const num = parseInt(value);
		if (isNaN(num) || num < 1 || num > 9) {
			setBoard((prev) => {
				const copy = structuredClone(prev);
				copy[row][col] = 0;
				return copy;
			});
		} else {
			setBoard((prev) => {
				const copy = structuredClone(prev);
				copy[row][col] = num;
				return copy;
			});
		}
	};
	const [solver, setSolver] = useState<SudokuSolver | null>(null);
	const [result, setResult] = useState<number[][] | null>(null);

	return (
		<main>
			<h1 className="title">数独ソルバー</h1>
			<div className="introduction">（かなり）高速に動作する数独ソルバー</div>
			<div className="sudoku-grid">
				{board.map((row, i) =>
					row.map((cell, j) => (
						<input
							key={`${i}-${j}`}
							type="text"
							inputMode="numeric"
							maxLength={1}
							className="sudoku-cell"
							value={cell === 0 ? "" : cell}
							onChange={(e) => handleChange(i, j, e.target.value)}
						/>
					))
				)}
			</div>
			<div className="sudoku-controls">
				<button
					className="sudoku-button"
					onClick={() => {
						const s = new SudokuSolver(board);
						setSolver(s);
						const firstSolution = s.next();
						setResult(firstSolution);
					}}
				>
					解く
				</button>
				<button
					className="sudoku-button"
					onClick={() => {
						if (!solver?.hasPrev()) {
							return;
						}
						const prev = solver.prev();
						if (prev) {
							setResult(prev);
						}
					}}
					disabled={!solver?.hasPrev()}
				>
					前へ
				</button>
				<button
					className="sudoku-button"
					onClick={() => {
						if (!solver?.hasNext()) {
							return;
						}
						const next = solver.next();
						if (next) {
							setResult(next);
						}
					}}
					disabled={!solver?.hasNext()}
				>
					次へ
				</button>
			</div>
			<div className="sudoku-result">
				<h2>現在の解</h2>
				{solver?.isExhausted() && result === null ? (
					<p>解が存在しません</p>
				) : result ? (
					<div className="sudoku-grid">
						{result.map((row, i) =>
							row.map((cell, j) => (
								<div
									key={`${i}-${j}`}
									className={`sudoku-cell ${board[i][j] === 0 ? "solved-cell" : ""}`}
								>
									{cell}
								</div>
							))
						)}
					</div>
				) : (
					<p>まだ解が生成されていません</p>
				)}
			</div>
		</main>
	);
}
