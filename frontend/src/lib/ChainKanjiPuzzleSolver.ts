export type CellType = { type: "disabled" } | { type: "free" } | { type: "fixed", kanji: string };

export default function* solveChainKanjiPuzzle(kanjiPairs: [string, string][], puzzleGrid: CellType[][]): Generator<string[][], void, void> {
    const kanjiSet = new Set<string>();
    for (const [kanji1, kanji2] of kanjiPairs) {
        kanjiSet.add(kanji1);
        kanjiSet.add(kanji2);
    }
    for (const row of puzzleGrid) {
        for (const cell of row) {
            if (cell.type === "fixed") {
                kanjiSet.add(cell.kanji);
            }
        }
    }
    const kanjiList = Array.from(kanjiSet).sort();
    const kanjiMap = new Map<string, number>();
    for (let i = 0; i < kanjiList.length; i++) {
        kanjiMap.set(kanjiList[i], i);
    }
    const kanjiEdges: number[][] = Array.from({ length: kanjiList.length }, () => []);
    const kanjiReverseEdges: number[][] = Array.from({ length: kanjiList.length }, () => []);
    for (const [kanji1, kanji2] of kanjiPairs) {
        const index1 = kanjiMap.get(kanji1)!;
        const index2 = kanjiMap.get(kanji2)!;
        kanjiEdges[index1].push(index2);
        kanjiReverseEdges[index2].push(index1);
    }

    const rows = puzzleGrid.length;
    const cols = puzzleGrid[0].length;
    const numCells = rows * cols;

    const cellEdges: number[][] = Array.from({ length: numCells }, () => []);
    const cellReverseEdges: number[][] = Array.from({ length: numCells }, () => []);

    const coordToIndex = (r: number, c: number) => r * cols + c;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellIndex = coordToIndex(r, c);
            if (puzzleGrid[r][c].type === "disabled") {
                continue;
            }
            for (const [nr, nc] of [[r + 1, c], [r, c + 1]]) {
                if (nr < rows && nc < cols && puzzleGrid[nr][nc].type !== "disabled") {
                    const neighborIndex = coordToIndex(nr, nc);
                    cellEdges[cellIndex].push(neighborIndex);
                    cellReverseEdges[neighborIndex].push(cellIndex);
                }
            }
        }
    }
    const puzzleGridFlat: CellType[] = puzzleGrid.flat();

    const cellKanjis: (number | null)[] = Array(numCells).fill(null);
    const candidates: number[][] = Array.from({ length: numCells }, (_, i) => {
        if (puzzleGridFlat[i].type === "disabled" || puzzleGridFlat[i].type === "fixed") {
            return [];
        }
        return Array.from({ length: kanjiList.length }, (_, j) => j);
    });
    for (let i = 0; i < numCells; i++) {
        const cell = puzzleGridFlat[i];
        if (cell.type === "free") {
            continue;
        }
        else if (cell.type === "fixed") {
            candidates[i] = [];
            const kanjiIndex = kanjiMap.get(cell.kanji)!;
            cellKanjis[i] = kanjiIndex;
            for (let j = 0; j < numCells; j++) {
                candidates[j] = candidates[j].filter(k => k !== kanjiIndex);
            }
            for (const neighborIndex of cellEdges[i]) {
                const neighborCandidates = [];
                for (const candidate of candidates[neighborIndex]) {
                    if (kanjiEdges[kanjiIndex].includes(candidate)) {
                        neighborCandidates.push(candidate);
                    }
                }
                candidates[neighborIndex] = neighborCandidates;
            }
            for (const neighborIndex of cellReverseEdges[i]) {
                const neighborCandidates = [];
                for (const candidate of candidates[neighborIndex]) {
                    if (kanjiReverseEdges[kanjiIndex].includes(candidate)) {
                        neighborCandidates.push(candidate);
                    }
                }
                candidates[neighborIndex] = neighborCandidates;
            }
        }
        else {
            candidates[i] = [];
            cellKanjis[i] = null; // disabled
        }
    }

}

function* findResultDfs(

) {
}
