export class SudokuSolver{
	private board: number[][];
	private solutions: number[][][] = [];
	private currentIndex: number = -1;
	private currentState: number[][] = [];

	constructor(board: number[][]) {
		this.board = structuredClone(board)
		this.currentState = structuredClone(board);
		this.prefetchNextSolution(true);
	}

	private prefetchNextSolution(isInitial: boolean = false): void {
		
	}

	public hasNext(): boolean{
		return this.currentIndex < this.solutions.length - 1 && this.solutions.length > 0;
	}

	public hasPrev():boolean{
		return this.currentIndex > 0;
	}

	public next(): number[][] | null{
		if(this.currentIndex < this.solutions.length - 1){
			this.currentIndex++;
			return this.solutions[this.currentIndex];
		}
		else {
			this.prefetchNextSolution();
			if (this.solutions.length > this.currentIndex + 1) {
				this.currentIndex++;
				return this.solutions[this.currentIndex];
			}
		}
		return null;
	}

	public prev(): number[][] | null{
		if(this.currentIndex > 0){
			this.currentIndex--;
			return this.solutions[this.currentIndex];
		}
		return null;
	}

	public current(): number[][]| null{
		if (this.currentIndex >= 0 && this.currentIndex < this.solutions.length) {
			return this.solutions[this.currentIndex];
		}
		return null;
	}
}