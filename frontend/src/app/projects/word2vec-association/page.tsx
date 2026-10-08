"use client";
import { useState, useRef } from "react";
import Word2Vec from "@/lib/Word2Vec";
import Link from "node_modules/next/dist/client/link";
import "@styles/word2vec-association.css";

const DualInput = ({ label, value, onChange, min, max, step, disabled }: {
    label: string, value: number, onChange: (value: number) => void, min: number, max: number, step: number, disabled: boolean
}) => (
    <fieldset className="dual-input-fieldset">
        <legend>{label}</legend>
        <div className="dual-inputs">
            <input type="range" min={min} max={max} value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} className="dual-input-range" disabled={disabled} />
            <input type="number" min={min} max={max} value={value} onChange={(e) => {
                let val = Number(e.target.value)
                if (val > max) {
                    val = max
                }
                if (val < min) {
                    val = min
                }
                onChange(val)
            }} className="dual-input-number"
                step={step} disabled={disabled} />
        </div>
    </fieldset>
);

interface AssociationSegment {
    from: string;
    to: string;
    distance: number;
};

export default function Word2VecAssociationPage() {
    const [startWord, setStartWord] = useState<string>("");
    const [goalWord, setGoalWord] = useState<string>("");
    const [startWordCandidates, setStartWordCandidates] = useState<string[]>([]);
    const [goalWordCandidates, setGoalWordCandidates] = useState<string[]>([]);
    const [distanceThreshold, setDistanceThreshold] = useState<number>(0.45);
    const [associationSegments, setAssociationSegments] = useState<AssociationSegment[]>([]);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const word2VecRef = useRef<Word2Vec | null>(null);

    const loadWord2VecData = async () => {
        if (isModelLoaded) {
            return;
        }
        const isConfirmed = confirm("Word2Vec データ（約 20MB）を読み込みますか？");
        if (!isConfirmed) {
            return;
        }
        const word2Vec = new Word2Vec();
        await word2Vec.loadData("/word2vec-common-japanese/words.txt", "/word2vec-common-japanese/word_vecs.bin", true);
        word2VecRef.current = word2Vec;
        setIsModelLoaded(true);
    };

    const getRandomWord = () => {
        if (!word2VecRef.current) {
            return "";
        }
        const vocab = word2VecRef.current.getVocab();
        const randomIndex = Math.floor(Math.random() * vocab.length);
        console.log("Random word selected:", vocab[randomIndex]);
        return vocab[randomIndex];
    };

    const handleFindAssociationPath = () => {
        if (!word2VecRef.current || !isModelLoaded) {
            return;
        }
        const word2Vec = word2VecRef.current;
        if (!word2Vec.isWordInVocab(startWord) || !word2Vec.isWordInVocab(goalWord)) {
            let errorMessage = "";
            if (!word2Vec.isWordInVocab(startWord)) {
                errorMessage += `「${startWord}」は語彙リストに含まれていません．\n`;
            }
            if (!word2Vec.isWordInVocab(goalWord)) {
                errorMessage += `「${goalWord}」は語彙リストに含まれていません．\n`;
            }
            setErrorMessage(errorMessage);
            setAssociationSegments([]);
            return;
        }
        if (startWord === goalWord) {
            setErrorMessage("スタートとゴールが同じです．");
            setAssociationSegments([]);
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setAssociationSegments([]);
        setTimeout(() => {
            try {
                const startIndex = word2Vec.getWordIndex(startWord) as number;
                const goalIndex = word2Vec.getWordIndex(goalWord) as number;
                const numWords = word2Vec.getNumWords();
                const parentForward = new Int32Array(numWords).fill(-1);
                const parentBackward = new Int32Array(numWords).fill(-1);
                parentForward[startIndex] = startIndex;
                parentBackward[goalIndex] = goalIndex;
                const queueForward = new Int32Array(numWords);
                const queueBackward = new Int32Array(numWords);
                let headForward = 0;
                let tailForward = 0;
                let headBackward = 0;
                let tailBackward = 0;
                queueForward[tailForward++] = startIndex;
                queueBackward[tailBackward++] = goalIndex;
                let meetNode = -1;
                while (headForward < tailForward && headBackward < tailBackward) {
                    const expandForward = (tailForward - headForward) <= (tailBackward - headBackward);
                    if (expandForward) {
                        const u = queueForward[headForward++];
                        const uVec = word2Vec.getWordVecByIndex(u) as Float32Array;
                        for (let v = 0; v < numWords; v++) {
                            if (parentForward[v] !== -1) {
                                continue;
                            }
                            const vVec = word2Vec.getWordVecByIndex(v) as Float32Array;
                            const distance = word2Vec.calcSimilarity(uVec, vVec);
                            if (distance >= distanceThreshold) {
                                parentForward[v] = u;
                                queueForward[tailForward++] = v;
                                if (parentBackward[v] !== -1) {
                                    meetNode = v;
                                    break;
                                }
                            }
                        }
                        if (meetNode !== -1) {
                            break;
                        }
                    }
                    else {
                        const u = queueBackward[headBackward++];
                        const uVec = word2Vec.getWordVecByIndex(u) as Float32Array;
                        for (let v = 0; v < numWords; v++) {
                            if (parentBackward[v] !== -1) {
                                continue;
                            }
                            const vVec = word2Vec.getWordVecByIndex(v) as Float32Array;
                            const distance = word2Vec.calcSimilarity(uVec, vVec);
                            if (distance >= distanceThreshold) {
                                parentBackward[v] = u;
                                queueBackward[tailBackward++] = v;
                                if (parentForward[v] !== -1) {
                                    meetNode = v;
                                    break;
                                }
                            }
                        }
                        if (meetNode !== -1) {
                            break;
                        }
                    }
                }

                if (meetNode === -1) {
                    setErrorMessage("経路が見つかりませんでした．閾値を下げてください．");
                    setAssociationSegments([]);
                }
                else {
                    const pathForward: number[] = [];
                    for (let v = meetNode; v !== startIndex; v = parentForward[v]) {
                        pathForward.push(v);
                    }
                    pathForward.push(startIndex);
                    pathForward.reverse();
                    const pathBackward: number[] = [];
                    for (let v = parentBackward[meetNode]; v !== goalIndex; v = parentBackward[v]) {
                        pathBackward.push(v);
                    }
                    if (meetNode !== goalIndex) {
                        pathBackward.push(goalIndex);
                    }
                    const path: number[] = [...pathForward, ...pathBackward];
                    const segments: AssociationSegment[] = [];
                    for (let i = 0; i < path.length - 1; i++) {
                        const fromIndex = path[i];
                        const toIndex = path[i + 1];
                        const fromWord = word2Vec.getWordByIndex(fromIndex) as string;
                        const toWord = word2Vec.getWordByIndex(toIndex) as string;
                        const fromVec = word2Vec.getWordVecByIndex(fromIndex) as Float32Array;
                        const toVec = word2Vec.getWordVecByIndex(toIndex) as Float32Array;
                        const distance = word2Vec.calcSimilarity(fromVec, toVec);
                        segments.push({ from: fromWord, to: toWord, distance });
                    }
                    setAssociationSegments(segments);
                    setErrorMessage(null);
                }
            }
            finally {
                setIsSearching(false);
            }
        }, 10);
    };

    const getMatchingWords = (query: string): string[] => {
        const maxCandidates = 20;
        if (!word2VecRef.current || !isModelLoaded || query.trim() === "") {
            return [];
        }
        const word2Vec = word2VecRef.current;
        const vocab = word2Vec.getVocab();
        const matches = [];
        for (const word of vocab) {
            if (matches.length >= maxCandidates) {
                break;
            }
            if (word.startsWith(query)) {
                matches.push(word);
            }
        }
        for (const word of vocab) {
            if (matches.length >= maxCandidates) {
                break;
            }
            if (word.includes(query) && !matches.includes(word)) {
                matches.push(word);
            }
        }
        return matches;
    };

    const handleStartWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartWord = e.target.value;
        setStartWord(newStartWord);
        setStartWordCandidates(getMatchingWords(newStartWord));
    };

    const handleGoalWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGoalWord = e.target.value;
        setGoalWord(newGoalWord);
        setGoalWordCandidates(getMatchingWords(newGoalWord));
    };

    return (
        <>
            <h1 className="title">自動連想ゲーム</h1>
            <div className="introduction">
                2 つの単語の間を自動で連想して最短経路で繋ぐ．<br />
                開発記事は<Link href="/blog/word2vec-association">こちら</Link>から．<br />
                単語リストは<Link href="/word2vec-common-japanese/words.txt">こちら</Link>から．
            </div>
            <div className="settings-form">
                <button className="load-model-button" onClick={loadWord2VecData} disabled={isModelLoaded}>
                    モデルを読み込む
                </button>
                <fieldset>
                    <legend>単語</legend>
                    <div className="word-input-container">
                        <label className="word-input-label">スタート</label>
                        <input className="word-input" type="text" value={startWord} onChange={handleStartWordChange} list="start-word-candidates" disabled={!isModelLoaded} />
                        <button onClick={() => setStartWord(getRandomWord())} disabled={!isModelLoaded} className="random-button">ランダム</button>
                    </div>
                    <div className="word-input-container">
                        <label className="word-input-label">ゴール</label>
                        <input className="word-input" type="text" value={goalWord} onChange={handleGoalWordChange} list="goal-word-candidates" disabled={!isModelLoaded} />
                        <button onClick={() => setGoalWord(getRandomWord())} disabled={!isModelLoaded} className="random-button">ランダム</button>
                    </div>
                    <datalist id="start-word-candidates">
                        {startWordCandidates.map((word, index) => (
                            <option key={index} value={word} />
                        ))}
                    </datalist>

                    <datalist id="goal-word-candidates">
                        {goalWordCandidates.map((word, index) => (
                            <option key={index} value={word} />
                        ))}
                    </datalist>
                </fieldset>
                <DualInput label="距離の閾値" value={distanceThreshold} onChange={setDistanceThreshold} min={0.0} max={1.0} step={0.01} disabled={!isModelLoaded} />
                <button onClick={handleFindAssociationPath} className="find-path-button" disabled={!isModelLoaded || !startWord || !goalWord || isSearching}>
                    {isSearching ? "計算中..." : "経路を計算"}
                </button>
            </div>
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}
            <div className="association-path">
                {associationSegments.length > 0 && (
                    <div className="association-segments">
                        <h2 className="association-path-title">
                            連想経路
                            <span className="association-path-length">（{associationSegments.length} ステップ）</span>
                        </h2>
                        <div className="path-timeline">
                            <div className="word-node start-node">
                                {associationSegments[0].from}
                            </div>
                            {associationSegments.map((segment, index) => {
                                const isGoal = (index === associationSegments.length - 1);
                                return (
                                    <div key={index}>
                                        <div className="edge-connector">
                                            <div className="edge-arrow">↓</div>
                                            <span className="edge-similarity">
                                                類似度：{segment.distance.toFixed(3)}
                                            </span>

                                        </div>
                                        <div className={`word-node ${isGoal ? "goal-node" : ""}`}>
                                            {segment.to}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
                }
            </div>
            <div className="license">
                <p>このアプリでは，以下のデータセット・リソースを加工して作成したデータ（語彙リスト・単語ベクトルバイナリ）を <Link href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</Link> の下で配布しています．</p>
                <ul>
                    <li>
                        <strong>語彙リスト</strong>：<Link href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">JMdict</Link>（<Link href="https://github.com/scriptin/jmdict-simplified">jmdict-simplified</Link> 経由，<Link href="https://www.edrdg.org/edrdg/licence.html">EDRDG Licence</Link>）および <Link href="https://github.com/WorksApplications/chiVe">chiVe</Link> の頻出語彙から抽出・選定して作成．
                    </li>
                    <li>
                        <strong>単語ベクトル</strong>：<Link href="https://www.worksap.co.jp">株式会社ワークスアプリケーションズ</Link> が <Link href="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</Link> で提供する <Link href="https://github.com/WorksApplications/chiVe">chiVe: Sudachi による日本語単語ベクトル</Link>（<code>v1.3 mc90</code> モデル）から，上記語彙リストに対応するベクトルを抽出・バイナリ化して作成．
                    </li>
                </ul>
            </div>
        </>
    )
}
