"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import "@styles/grid-replace.css";

interface Grid { 
	grid: string[][];
}

interface ReplaceRule { 
	find: Grid;
	replace: Grid;
}

interface ReplaceResult {
	newGrid: Grid;
	isMatched: boolean;
	appliedRuleIndex: number | null;
	matchedPosition: { row: number; col: number } | null;
}

function stepReplace(grid: Grid, rules: ReplaceRule[]): Grid {
	const newGrid: string[][] = grid.grid.map(row => [...row]);
}

export default function GridReplacePage() {
	const mainGridRef = useRef<Grid | null>(null);


	return (
		<>

		</>
	)
}