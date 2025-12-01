export type PriorityMap = number[];
export type PresetStrategy = {
	name: string;
	map: PriorityMap;
};

export const getBestMoveByPriority = (validMoves: number[], priorityMap: PriorityMap): number | null => {
	if (validMoves.length === 0) {
		return null;
	}
	let bestMove = validMoves[0];
	let highestPriority = priorityMap[bestMove];
	for (const move of validMoves) {
		if (priorityMap[move] > highestPriority) {
			bestMove = move;
			highestPriority = priorityMap[move];
		}
	}
	return bestMove;
};

export const parsePriorityCSV = (csvText: string): PriorityMap | null => {
	const values = csvText.split(/[^0-9\-\.]+/).map(s => parseInt(s)).filter(n => !isNaN(n));
	if (values.length !== 64) {
		return null;
	}
	return values;
};

const STRATEGY_NORMAL: PriorityMap = [
	64, 12, 40, 60, 59, 39, 11, 63,
	16, 8, 20, 36, 35, 19, 7, 15,
	44, 24, 32, 48, 47, 31, 23, 43,
	56, 28, 52, 4, 3, 51, 27, 55,
	54, 26, 50, 2, 1, 49, 25, 53,
	42, 22, 30, 46, 45, 29, 21, 41,
	14, 6, 18, 34, 33, 17, 5, 13,
	62, 10, 38, 58, 57, 37, 9, 61
];

const STRATEGY_SCAN: PriorityMap = Array(64).fill(0);
const STRATEGY_WEAK: PriorityMap = STRATEGY_NORMAL.map(value => -value);

export const PRESETS: PresetStrategy[] = [
	{ name: "SCAN ORDER (Left-Top first)", map: STRATEGY_SCAN },
	{ name: "Normal (Standard)", map: STRATEGY_NORMAL },
	{ name: "Weak (Reverse)", map: STRATEGY_WEAK },
];