'use client'
import { useState } from 'react'
import { SudokuSolver } from '@/lib/sudokuSolver'
import '@styles/sudoku.css'

export default function SudokuPage() {
	const [board, setBoard] = useState<number[][]>(
		Array.from({ length: 9 }, () => Array(9).fill(0))
	);
	const handleChange = (row: number, col: number, value: string) => {
		const num = parseInt(value);
		if (isNaN(num) || num < 1 || num > 9) {
			setBoard(prev => {
				const copy = structuredClone(prev);
				copy[row][col] = 0;
				return copy;
			});
		}
		else {
			setBoard(prev => {
				const copy = structuredClone(prev);
				copy[row][col] = num;
				console.log(copy);
				return copy;
			});
		}
	};

	return (
		<main>
			<h1 className="title">数独ソルバー</h1>
			<div className="introduction">
				高速に動作する数独ソルバーです
			</div>
			<div className="sudoku-grid">
				{
					board.map((row, i) =>
						row.map((cell, j) => (
							<input
								key={`${i}-${j}`}
								type="text"
								inputMode="numeric"
								maxLength={1}
								className="sudoku-cell"
								value={cell === 0 ? '' : cell}
								onChange={(e) => handleChange(i, j, e.target.value)}
							/>
						)
						)
					)
				}
			</div>
		</main>
	);
}