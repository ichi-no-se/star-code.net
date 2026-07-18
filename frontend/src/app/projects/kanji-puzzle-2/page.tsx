"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import solveChainKanjiPuzzle, { CellType } from "@/lib/ChainKanjiPuzzleSolver";
import "@styles/kanji-puzzle-2.css";

export default function KanjiPuzzle2Page() {
    const [rows, setRows] = useState<number>(3);
    const [cols, setCols] = useState<number>(3);
    const [rowsInput, setRowsInput] = useState<string>(rows.toString());
    const [colsInput, setColsInput] = useState<string>(cols.toString());
    const [slots, setSlots] = useState<(string | null)[][]>(Array(rows).fill(null).map(() => Array(cols).fill("")));
    const [commonKanjiPairsData, setCommonKanjiPairsData] = useState<[string, string][]>([]);
    const [allKanjiPairsData, setAllKanjiPairsData] = useState<[string, string][]>([]);
    const [vocabularyOptions, setVocabularyOptions] = useState<"common" | "all">("common");
    const [solutions, setSolutions] = useState<string[][][]>([]);
    const [solutionIndex, setSolutionIndex] = useState<number>(0);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [ngKanjis, setNgKanjis] = useState<string[]>([""]);
    const [ngKanjiPairs, setNgKanjiPairs] = useState<string[]>([""]);
    const [okKanjiPairs, setOkKanjiPairs] = useState<string[]>([""]);
    const solverRef = useRef<Generator<string[][], void, void> | null>(null);

    useEffect(() => {
        fetch("/kanji-puzzle/kanji_pairs_all.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch JSON data: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                setAllKanjiPairsData(data);
            })
            .catch(error => {
                console.error("Error fetching JSON data:", error);
            });
        fetch("/kanji-puzzle/kanji_pairs_common.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch JSON data: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                setCommonKanjiPairsData(data);
            })
            .catch(error => {
                console.error("Error fetching JSON data:", error);
            });
    }, []);

    const handleStartSearch = () => {
        setIsSearching(true);
        const pairs = vocabularyOptions === "common" ? commonKanjiPairsData : allKanjiPairsData;
        // 熟語を追加
        for (const okKanjiPair of okKanjiPairs) {
            if ([...okKanjiPair].length === 2) {
                const firstKanji = [...okKanjiPair][0];
                const secondKanji = [...okKanjiPair][1];
                if (pairs.findIndex(([k1, k2]) => k1 === firstKanji && k2 === secondKanji) === -1) {
                    pairs.push([firstKanji, secondKanji]);
                }
            }
        }
        // 漢字を除外
        const ngKanjiSet = new Set(ngKanjis.filter(k => k !== ""));
        const filteredPairs = pairs.filter(([k1, k2]) => !ngKanjiSet.has(k1) && !ngKanjiSet.has(k2));
        // 熟語を除外
        const ngKanjiPairSet = new Set(ngKanjiPairs.filter(p => [...p].length === 2).map(p => [...p].join("")));
        const finalPairs = filteredPairs.filter(([k1, k2]) => !ngKanjiPairSet.has(k1 + k2));

        // 1文字にする
        const newSlots = slots.map(row => row.map(cell => {
            if (cell === null) {
                return null;
            }
            else if (cell === "") {
                return "";
            } else {
                return [...cell][0];
            }
        }));
        setSlots(newSlots);
        const puzzleGrid: CellType[][] = newSlots.map(row => row.map(cell => {
            if (cell === null) {
                return { type: "disabled" } as CellType;
            }
            else if (cell === "") {
                return { type: "free" } as CellType;
            } else {
                return { type: "fixed", kanji: cell } as CellType;
            }
        }));
        solverRef.current = solveChainKanjiPuzzle(finalPairs, puzzleGrid);


        setSolutionIndex(0);
        const newSolutions: string[][][] = [];
        for (let i = 0; i < 2; i++) {
            const nextSolution = solverRef.current.next();
            if (nextSolution.done) {
                break;
            }
            newSolutions.push(nextSolution.value);
        }
        setSolutions(newSolutions);
    };

    const incrementSolutionIndex = () => {
        if (solutionIndex < solutions.length - 2) {
            setSolutionIndex(solutionIndex + 1);
        }
        else if (solutionIndex === solutions.length - 2 && solverRef.current) {
            const nextSolution = solverRef.current.next();
            if (!nextSolution.done) {
                setSolutions([...solutions, nextSolution.value]);
            }
            setSolutionIndex(solutionIndex + 1);
        }
    };

    const decrementSolutionIndex = () => {
        if (solutionIndex > 0) {
            setSolutionIndex(solutionIndex - 1);
        }
    };

    const handleCellChange = (r: number, c: number, val: string) => {
        setIsSearching(false);
        setSlots(prev => {
            const newSlots = prev.map(row => [...row]);
            newSlots[r][c] = val;
            return newSlots;
        });
    };

    const toggleCellDisabled = (r: number, c: number) => {
        setIsSearching(false);
        setSlots(prev => {
            const newSlots = prev.map(row => [...row]);
            if (newSlots[r][c] === null) {
                newSlots[r][c] = "";
            } else {
                newSlots[r][c] = null;
            }
            return newSlots;
        });
    };

    const changeGridSize = (newRows: number, newCols: number) => {
        setIsSearching(false);
        if (newRows < 1) newRows = 1;
        if (newCols < 1) newCols = 1;
        if (newRows > 6) newRows = 6;
        if (newCols > 6) newCols = 6;
        const newSlots = Array(newRows).fill(null).map((_, r) => {
            return Array(newCols).fill(null).map((_, c) => {
                if (r < slots.length && c < slots[0].length) {
                    return slots[r][c];
                } else {
                    return "";
                }
            });
        });
        setSlots(newSlots);
        setSolutions([]);
        setSolutionIndex(0);
        setRows(newRows);
        setCols(newCols);
    }

    const handleRowsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsInput(e.target.value);
        const parsedValue = parseInt(e.target.value);
        if (!isNaN(parsedValue)) {
            changeGridSize(parsedValue, cols);
        }
    };

    const handleColsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColsInput(e.target.value);
        const parsedValue = parseInt(e.target.value);
        if (!isNaN(parsedValue)) {
            changeGridSize(rows, parsedValue);
        }
    };

    const handleRowsBlur = () => {
        setRowsInput(rows.toString());
    };

    const handleColsBlur = () => {
        setColsInput(cols.toString());
    };

    return (
        <>
            <h1 className="title">スーパー和同開珎ソルバー</h1>
            <div className="introduction">
                和同開珎を繋げたスーパー和同開珎のソルバーです．<br />
                関連記事は <Link href="/blog/kanji-puzzle">こちら</Link>から．<br />
                ダブルクリックでセルを無効化できます．
            </div>
            <div className="main-layout">
                <div className="input-panel-wrapper">
                    <p className="input-panel-title">入力</p>
                    <div className="grid-size-inputs">
                        <label>行数: <input type="number" value={rowsInput} onChange={handleRowsInputChange} onBlur={handleRowsBlur} /></label>
                        <label>列数: <input type="number" value={colsInput} onChange={handleColsInputChange} onBlur={handleColsBlur} /></label>
                    </div>
                    <div className="input-grid">
                        {slots.map((row, r) => (
                            <div key={r}>
                                <div className="input-row">
                                    {row.map((cell, c) => (
                                        <div key={c}>
                                            <input
                                                type="text"
                                                value={cell || ""}
                                                onChange={e => handleCellChange(r, c, e.target.value)}
                                                onDoubleClick={() => {
                                                    toggleCellDisabled(r, c);
                                                }}
                                                className={`input-cell ${cell === null ? "disabled" : ""}`}
                                                readOnly={cell === null}
                                            />
                                            {c < row.length - 1 && <div className="right-arrow">→</div>}
                                        </div>
                                    ))}
                                </div>
                                {r < slots.length - 1 && (
                                    <div className="input-row-arrows">
                                        {row.map((_, c) => (
                                            <div className="arrow-column-wrapper" key={c}>
                                                <div key={c} className="down-arrow">↓</div>
                                                {c < row.length - 1 && <div className="down-arrow-spacer" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="input-controls">
                        <div className="vocabulary-options">
                            <p>熟語の範囲</p>
                            <label><input type="radio" name="vocabulary" value="common" checked={vocabularyOptions === "common"} onChange={() => { setVocabularyOptions("common"); setIsSearching(false); }} />基礎</label>
                            <label><input type="radio" name="vocabulary" value="all" checked={vocabularyOptions === "all"} onChange={() => { setVocabularyOptions("all"); setIsSearching(false); }} />基礎 + 発展</label>
                        </div>
                        <div className="ng-ok-list-container">
                            <div className="ng-ok-list">
                                <p>NG 漢字</p>
                                {ngKanjis.map((ngKanji, index) => (
                                    <div key={index}>
                                        <input
                                            key={index}
                                            type="text"
                                            value={ngKanji}
                                            onChange={e => {
                                                const newNgKanjis = [...ngKanjis];
                                                newNgKanjis[index] = e.target.value;
                                                setNgKanjis(newNgKanjis);
                                            }}
                                        />
                                    </div>
                                ))}
                                <div className="list-buttons">
                                    <button onClick={() => {
                                        setNgKanjis([...ngKanjis, ""]);
                                        setIsSearching(false);
                                    }} className="add-button">追加</button>
                                    <button onClick={() => {
                                        setNgKanjis(ngKanjis.slice(0, -1));
                                        setIsSearching(false);
                                    }}
                                        disabled={ngKanjis.length <= 1} className="delete-button">削除</button>
                                </div>
                            </div>
                            <div className="ng-ok-list">
                                <p>NG 熟語</p>
                                {ngKanjiPairs.map((ngKanjiPair, index) => (
                                    <div key={index}>
                                        <input
                                            key={index}
                                            type="text"
                                            value={ngKanjiPair}
                                            onChange={e => {
                                                const newNgKanjiPairs = [...ngKanjiPairs];
                                                newNgKanjiPairs[index] = e.target.value;
                                                setNgKanjiPairs(newNgKanjiPairs);
                                                setIsSearching(false);
                                            }}
                                        />
                                    </div>
                                ))}
                                <div className="list-buttons">
                                    <button onClick={() => {
                                        setNgKanjiPairs([...ngKanjiPairs, ""]);
                                        setIsSearching(false);
                                    }} className="add-button">追加</button>
                                    <button onClick={() => {
                                        setNgKanjiPairs(ngKanjiPairs.slice(0, -1));
                                        setIsSearching(false);
                                    }}
                                        disabled={ngKanjiPairs.length <= 1} className="delete-button">削除</button>
                                </div>
                            </div>
                            <div className="ng-ok-list">
                                <p>追加熟語</p>
                                {okKanjiPairs.map((okKanjiPair, index) => (
                                    <div key={index}>
                                        <input
                                            key={index}
                                            type="text"
                                            value={okKanjiPair}
                                            onChange={e => {
                                                const newOkKanjiPairs = [...okKanjiPairs];
                                                newOkKanjiPairs[index] = e.target.value;
                                                setOkKanjiPairs(newOkKanjiPairs);
                                                setIsSearching(false);
                                            }}
                                        />
                                    </div>
                                ))}
                                <div className="list-buttons">
                                    <button onClick={() => {
                                        setOkKanjiPairs([...okKanjiPairs, ""]);
                                        setIsSearching(false);
                                    }} className="add-button">追加</button>
                                    <button onClick={() => {
                                        setOkKanjiPairs(okKanjiPairs.slice(0, -1));
                                        setIsSearching(false);
                                    }}
                                        disabled={okKanjiPairs.length <= 1} className="delete-button">削除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleStartSearch} className="search-button">解を探索</button>
                </div>
                <div className="output-panel-wrapper">
                    <p className="output-panel-title">出力</p>
                    <div className="output-spacer" />
                    {!isSearching && (
                        <p className="output-message">まだ解が生成されていません</p>
                    )}
                    {isSearching && solutions.length === 0 && (
                        <p className="output-message">解が存在しません</p>
                    )}
                    {isSearching && solutions.length > 0 && (
                        <>
                            <div className="output-grid">
                                {solutions[solutionIndex].map((row, r) => (
                                    <div key={r}>
                                        <div className="output-row">
                                            {row.map((cell, c) => {
                                                const originalCell = slots[r][c];
                                                let cellClassName = "output-cell";
                                                if (originalCell === null) {
                                                    cellClassName += " disabled";
                                                }
                                                else if (originalCell === "") {
                                                    cellClassName += " free";
                                                }
                                                else {
                                                    cellClassName += " fixed";
                                                }
                                                return (
                                                    <div key={c}>
                                                        <div className={cellClassName}>{cell}</div>
                                                        {c < row.length - 1 && <div className="right-arrow">→</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {r < solutions[solutionIndex].length - 1 && (
                                            <div className="output-row-arrows">
                                                {row.map((_, c) => (
                                                    <div className="arrow-column-wrapper" key={c}>
                                                        <div key={c} className="down-arrow">↓</div>
                                                        {c < row.length - 1 && <div className="down-arrow-spacer" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="solution-navigation">
                                <button onClick={decrementSolutionIndex} disabled={solutionIndex === 0} >前へ</button>
                                <button onClick={incrementSolutionIndex} disabled={solutionIndex === solutions.length - 1} >次へ</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="license">
                本 Web アプリでは，<Link href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">EDICT</Link> の <Link href="https://www.edrdg.org/edrdg/licence.html">ライセンス</Link> に基づき，<Link href="https://github.com/scriptin/jmdict-simplified">jmdict-simplified</Link> の JMdict データを加工して使用しています．
            </div>
        </>
    )
}
