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
            cellKanjis[i] = -1; // disabled
        }
    }
    yield* findResultDfs(
        kanjiList.length,
        kanjiEdges,
        kanjiReverseEdges,
        cellEdges,
        cellReverseEdges,
        cellKanjis,
        candidates,
        kanjiList,
        rows,
        cols
    );
}

function* findResultDfs(
    numKanjis: number,
    kanjiEdges: number[][],
    kanjiReverseEdges: number[][],
    cellEdges: number[][],
    cellReverseEdges: number[][],
    cellKanjis: (number | null)[],
    candidates: number[][],
    kanjiList: string[],
    rows: number,
    cols: number
): Generator<string[][], void, void> {
    // 最も候補が少ないセルを選ぶ
    let minCandidateCount = Infinity;
    let minCandidateCellIndex = null;
    for (let i = 0; i < cellKanjis.length; i++) {
        if (cellKanjis[i] !== null) {
            continue;
        }
        const candidateCount = candidates[i].length;
        if (candidateCount === 0) {
            // 候補がないセルがある場合探索を打ち切る
            return;
        }
        if (candidateCount < minCandidateCount) {
            minCandidateCount = candidateCount;
            minCandidateCellIndex = i;
        }
    }
    if (minCandidateCellIndex === null) {
        // すべてのセルが埋まった場合、結果を返す
        const result: string[][] = [];
        for (let r = 0; r < rows; r++) {
            const row: string[] = [];
            for (let c = 0; c < cols; c++) {
                const cellIndex = r * cols + c;
                if (cellKanjis[cellIndex] === -1) {
                    row.push(""); // disabled
                } else {
                    row.push(kanjiList[cellKanjis[cellIndex]!]);
                }
            }
            result.push(row);
        }
        yield result;
        return;
    }

    const cellIndex = minCandidateCellIndex;
    for (const kanjiIndex of candidates[cellIndex]) {
        // 現在のセルに漢字を割り当てる
        const newCellKanjis = [...cellKanjis];
        newCellKanjis[cellIndex] = kanjiIndex;
        const newCandidates = candidates.map(c => [...c]);
        newCandidates[cellIndex] = [];
        let valid = true;
        // 全体からこの候補を削除する
        for (let i = 0; i < newCandidates.length; i++) {
            newCandidates[i] = newCandidates[i].filter(k => k !== kanjiIndex);
            if (newCandidates[i].length === 0 && newCellKanjis[i] === null) {
                valid = false;
                break;
            }
        }
        if (valid === false) {
            continue;
        }
        // 隣接セルの候補を更新する
        for (const neighborIndex of cellEdges[cellIndex]) {
            if (newCellKanjis[neighborIndex] === null) {
                const neighborCandidates = [];
                for (const candidate of newCandidates[neighborIndex]) {
                    if (kanjiEdges[kanjiIndex].includes(candidate)) {
                        neighborCandidates.push(candidate);
                    }
                }
                newCandidates[neighborIndex] = neighborCandidates;
                if (neighborCandidates.length === 0) {
                    valid = false;
                    break;
                }
            }
        }
        if (valid === false) {
            continue;
        }
        for (const neighborIndex of cellReverseEdges[cellIndex]) {
            if (newCellKanjis[neighborIndex] === null) {
                const neighborCandidates = [];
                for (const candidate of newCandidates[neighborIndex]) {
                    if (kanjiReverseEdges[kanjiIndex].includes(candidate)) {
                        neighborCandidates.push(candidate);
                    }
                }
                newCandidates[neighborIndex] = neighborCandidates;
                if (neighborCandidates.length === 0) {
                    valid = false;
                    break;
                }
            }
        }
        if (valid === false) {
            continue;
        }
        yield* findResultDfs(
            numKanjis,
            kanjiEdges,
            kanjiReverseEdges,
            cellEdges,
            cellReverseEdges,
            newCellKanjis,
            newCandidates,
            kanjiList,
            rows,
            cols
        );
    }
}
