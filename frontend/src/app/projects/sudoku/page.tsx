"use client";
import Link from "next/link";
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
		<>
			<h1 className="title">数独ソルバー</h1>
			<div className="introduction">
				（かなり）高速に動作する数独ソルバー，関連記事は<Link href="/blog/sudoku">こちら</Link>から．<br />
				解が存在しない場合，全探索を行うため，非常に時間がかかることがあります．
			</div>
			<div className="sudoku-panel-wrapper">
				<div className="sudoku-panel">
					<p className="label">入力</p>
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
					</div>
				</div>
				<div className="sudoku-panel">
					<p className="label">解</p>
					<div className="sudoku-result">
						<div className="sudoku-grid">
							{Array.from({ length: 9 }).map((_, i) =>
								Array.from({ length: 9 }).map((_, j) => {
									const value = result?.[i]?.[j] ?? 0;
									const isFilled = result !== null && value !== 0;
									const isSolved = result !== null && board[i][j] === 0 && value !== 0;
									return (
										<div
											key={`${i}-${j}`}
											className={`sudoku-cell ${isFilled ? "filled-cell" : ""} ${isSolved ? "solved-cell" : ""}`}>
											{isFilled ? value : ""}
										</div>
									);
								})
							)}
						</div>
					</div>
					<div className="sudoku-controls">
						{result &&
							<>
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
							</>
						}
						{!result && solver && solver.isExhausted() && (
							<p className="sudoku-message">
								解が存在しません
							</p>
						)}
						{!solver && (
							<p className="sudoku-message">
								まだ解が生成されていません
							</p>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
