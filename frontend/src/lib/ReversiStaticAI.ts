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

const STRATEGY_ICHINOSE: PriorityMap = [
	54, 12, 32, 20, 16, 42, 9, 47,
	8, 7, 25, 29, 13, 11, 2, 3,
	60, 26, 62, 50, 44, 59, 21, 53,
	27, 36, 58, 28, 52, 30, 33, 31,
	22, 19, 40, 35, 39, 61, 34, 48,
	45, 18, 49, 37, 56, 55, 38, 51,
	0, 1, 24, 43, 14, 15, 4, 5,
	46, 10, 41, 23, 17, 57, 6, 63
];

const STRATEGY_TAISA: PriorityMap = [
	59, 3, 25, 32, 43, 29, 8, 19,
	1, 4, 36, 20, 44, 53, 9, 17,
	21, 23, 63, 45, 46, 42, 27, 56,
	14, 33, 37, 31, 12, 62, 57, 22,
	40, 60, 41, 48, 26, 16, 24, 2,
	55, 38, 50, 11, 35, 52, 34, 61,
	6, 58, 51, 15, 30, 64, 5, 18,
	47, 7, 39, 13, 28, 49, 10, 54,
];

const STRATEGY_AYU: PriorityMap = [
	64, 9, 53, 21, 22, 54, 10, 61,
	16, 8, 32, 40, 33, 25, 5, 11,
	55, 31, 50, 46, 41, 49, 26, 60,
	24, 39, 42, 0, 0, 45, 34, 19,
	23, 38, 47, 0, 0, 43, 35, 20,
	56, 30, 51, 44, 48, 52, 27, 59,
	15, 7, 29, 37, 36, 28, 6, 12,
	63, 14, 57, 18, 17, 58, 13, 62
];

const STRATEGY_ICHINOSE_REVERESE: PriorityMap = [
	5, 15, 11, 31, 23, 16, 44, 3,
	60, 10, 12, 35, 62, 17, 13, 34,
	8, 9, 56, 61, 43, 48, 14, 7,
	30, 24, 45, 55, 52, 26, 42, 2,
	27, 33, 54, 51, 1, 46, 57, 59,
	18, 20, 47, 41, 40, 38, 19, 25,
	50, 21, 28, 63, 53, 32, 22, 58,
	4, 37, 39, 29, 36, 49, 0, 6
];

const STRATEGY_TAISA_REVERSE: PriorityMap = [
	3, 40, 29, 51, 7, 23, 39, 1,
	54, 19, 15, 55, 64, 14, 20, 42,
	31, 46, 44, 34, 33, 26, 16, 12,
	11, 38, 59, 57, 49, 36, 30, 28,
	18, 60, 63, 37, 4, 47, 62, 6,
	43, 53, 10, 32, 48, 13, 24, 17,
	35, 27, 41, 56, 45, 50, 21, 61,
	2, 58, 9, 8, 22, 25, 52, 5
];

const STRATEGY_AYU_REVERSE: PriorityMap = [
	1, 56, 12, 44, 43, 11, 55, 4,
	49, 57, 18, 25, 32, 20, 60, 54,
	10, 15, 34, 19, 24, 39, 16, 5,
	41, 26, 36, 0, 0, 40, 31, 46,
	42, 27, 33, 0, 0, 37, 30, 45,
	9, 14, 35, 21, 17, 38, 13, 6,
	50, 58, 23, 28, 29, 22, 59, 53,
	2, 51, 8, 47, 48, 7, 52, 3
];


export const PRESETS: PresetStrategy[] = [
	{ name: "戦略：一之瀬", map: STRATEGY_ICHINOSE },
	{ name: "戦略：taisa", map: STRATEGY_TAISA },
	{ name: "戦略：ayu", map: STRATEGY_AYU },
	{ name: "戦略：一之瀬（reverse）", map: STRATEGY_ICHINOSE_REVERESE },
	{ name: "戦略：taisa（reverse）", map: STRATEGY_TAISA_REVERSE },
	{ name: "戦略：ayu（reverse）", map: STRATEGY_AYU_REVERSE },
];