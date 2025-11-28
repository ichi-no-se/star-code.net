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
	120, -20, 20, 5, 5, 20, -20, 120,
	-20, -40, -5, -5, -5, -5, -40, -20,
	20, -5, 15, 3, 3, 15, -5, 20,
	5, -5, 3, 3, 3, 3, -5, 5,
	5, -5, 3, 3, 3, 3, -5, 5,
	20, -5, 15, 3, 3, 15, -5, 20,
	-20, -40, -5, -5, -5, -5, -40, -20,
	120, -20, 20, 5, 5, 20, -20, 120,
];

const STRATEGY_SCAN: PriorityMap = Array(64).fill(0);
const STRATEGY_WEAK: PriorityMap = STRATEGY_NORMAL.map(value => -value);

export const PRESETS: PresetStrategy[] = [
	{ name: "Normal (Standard)", map: STRATEGY_NORMAL },
	{ name: "SCAN ORDER (Left-Top first)", map: STRATEGY_SCAN },
	{ name: "Weak (Reverse)", map: STRATEGY_WEAK },
];