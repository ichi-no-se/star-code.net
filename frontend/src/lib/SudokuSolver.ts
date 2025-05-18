class SolverCore {
	private isExhausted: boolean = false;
	private currentBoard: number[] = [];
	private fillOrder: number[][] = []; // (埋める数字，行の先頭 index)
	private rowUsed: number[] = []; // 各数字ごとの行利用状況
	private colUsed: number[] = []; // 各数字ごとの列利用状況
	private boxUsed: number[] = []; // 各数字ごとのブロック利用状況
	private cellBoxBit: number[] = []; // それぞれの box の id を 1 << boxID で持つ
	private history: number[] = []; // スタックの代わりの履歴
	private numCellsToFill: number = 0;
	constructor(initialBoard: number[][]) {
		this.init(initialBoard);
	}
	private init(initialBoard: number[][]): void {
		this.isExhausted = false;
		this.currentBoard = new Array(81);
		this.fillOrder = Array.from({ length: 81 }, () => [0, 0]);
		this.rowUsed = new Array(9).fill(0);
		this.colUsed = new Array(9).fill(0);
		this.boxUsed = new Array(9).fill(0);
		this.cellBoxBit = new Array(81);
		this.history = new Array(81).fill(-1);
		this.numCellsToFill = 0;

		const rowAppearCount = new Array(9).fill(0);
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				const k = i * 9 + j;
				this.cellBoxBit[k] = 1 << (Math.floor(i / 3) * 3 + Math.floor(j / 3));
				if (initialBoard[i][j] === 0) {
					this.currentBoard[k] = -1;
				} else {
					const num = initialBoard[i][j] - 1;
					this.currentBoard[k] = num;
					if(this.rowUsed[num] & (1 << i) || this.colUsed[num] & (1 << j) || this.boxUsed[num] & this.cellBoxBit[k]) {
						this.isExhausted = true;
						return;
					}
					this.rowUsed[num] |= 1 << i;
					this.colUsed[num] |= 1 << j;
					this.boxUsed[num] |= this.cellBoxBit[k];
					rowAppearCount[num]++;
				}
			}
		}
		for (let i = 0; i < 9; i++) {
			let maxAppearCount = -1;
			let candidate = -1;
			for (let j = 0; j < 9; j++) {
				if (rowAppearCount[j] > maxAppearCount) {
					maxAppearCount = rowAppearCount[j];
					candidate = j;
				}
			}
			rowAppearCount[candidate] = -1;
			for (let j = 0; j < 9; j++) {
				if (~this.rowUsed[candidate] & (1 << j)) {
					this.fillOrder[this.numCellsToFill][0] = candidate;
					this.fillOrder[this.numCellsToFill][1] = j * 9; // 行の先頭 index
					this.numCellsToFill++;
				}
			}
		}
	}

	public findNextSolution(isInitial: boolean = false): number[][] | null {
		if (this.isExhausted) {
			return null;
		}
		let currentIndex;
		if (isInitial) {
			currentIndex = 0;
		} else {
			currentIndex = this.numCellsToFill - 1;
		}
		while (currentIndex !== this.numCellsToFill && currentIndex !== -1) {
			const num = this.fillOrder[currentIndex][0];
			const rowIndex = this.fillOrder[currentIndex][1];
			if (this.history[currentIndex] !== -1) {
				this.colUsed[num] &= ~(1 << this.history[currentIndex]);
				this.boxUsed[num] &= ~this.cellBoxBit[rowIndex + this.history[currentIndex]];
				this.currentBoard[rowIndex + this.history[currentIndex]] = -1;
			}
			while (true) {
				this.history[currentIndex]++;
				if (this.history[currentIndex] === 9) {
					this.history[currentIndex] = -1;
					currentIndex--;
					break;
				}
				if (~this.colUsed[num] & (1 << this.history[currentIndex]) && ~this.boxUsed[num] & this.cellBoxBit[rowIndex + this.history[currentIndex]] && this.currentBoard[rowIndex + this.history[currentIndex]] === -1) {
					this.colUsed[num] |= 1 << this.history[currentIndex];
					this.boxUsed[num] |= this.cellBoxBit[rowIndex + this.history[currentIndex]];
					this.currentBoard[rowIndex + this.history[currentIndex]] = num;
					currentIndex++;
					break;
				}
			}
		}
		if (currentIndex === this.numCellsToFill) {
			const solution = Array.from({ length: 9 }, () => Array(9));
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					solution[i][j] = this.currentBoard[i * 9 + j] + 1;
				}
			}
			return solution;
		}
		else {
			this.isExhausted = true;
			return null;
		}
	}
	public getIsExhausted(): boolean {
		return this.isExhausted;
	}
}

export class SudokuSolver {
	private core: SolverCore;
	private solutions: number[][][] = [];
	private currentIndex: number = -1;

	constructor(board: number[][]) {
		this.core = new SolverCore(board);
		this.prefetchNextSolution(true);
	}

	private prefetchNextSolution(isInitial: boolean = false): void {
		const solution = this.core.findNextSolution(isInitial);
		if (solution) {
			this.solutions.push(solution);
		}
	}

	public hasNext(): boolean {
		return (
			this.currentIndex < this.solutions.length - 1 && this.solutions.length > 0
		);
	}

	public hasPrev(): boolean {
		return this.currentIndex > 0;
	}

	public next(): number[][] | null {
		if (this.currentIndex < this.solutions.length - 2) {
			this.currentIndex++;
			return this.solutions[this.currentIndex];
		} else {
			this.prefetchNextSolution();
			if (this.solutions.length > this.currentIndex + 1) {
				this.currentIndex++;
				return this.solutions[this.currentIndex];
			}
		}
		return null;
	}

	public prev(): number[][] | null {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			return this.solutions[this.currentIndex];
		}
		return null;
	}

	public current(): number[][] | null {
		if (this.currentIndex >= 0 && this.currentIndex < this.solutions.length) {
			return this.solutions[this.currentIndex];
		}
		return null;
	}

	public isExhausted(): boolean {
		return this.core.getIsExhausted();
	}
}
