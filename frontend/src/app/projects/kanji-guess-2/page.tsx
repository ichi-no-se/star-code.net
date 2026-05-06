"use client";
import { FastTextKanji, SimilarityResult } from "@/lib/FastTextKanji";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "@styles/kanji-guess-2.css";

type AnswerRange = "edu_u3" | "education" | "jis1";
type GameState = "loading" | "playing" | "gave_up" | "result";
type FeedbackMessage = "already_guessed" | "appear_in_ranking" | "invalid_kanji" | "none";

const VOCAB_URLS: Record<AnswerRange, string> = {
	"edu_u3": "/kanji-vec/kanji_edu_u3_vocab.txt",
	"education": "/kanji-vec/kanji_education_vocab.txt",
	"jis1": "/kanji-vec/kanji_jis1_vocab.txt",
};

const FEEDBACK_MESSAGES: Record<FeedbackMessage, string> = {
	"already_guessed": "その漢字は既に推測しています",
	"appear_in_ranking": "その漢字は既にランキングに表示されています",
	"invalid_kanji": "入力は候補の漢字に含まれていません",
	"none": "",
};

export default function KanjiGuess2Page() {
	const scrollEndRef = useRef<HTMLDivElement>(null);
	const kanjiModelRef = useRef<FastTextKanji>(new FastTextKanji());
	const vocabListRef = useRef<Record<AnswerRange, Set<string>>>({
		"edu_u3": new Set(),
		"education": new Set(),
		"jis1": new Set(),
	});
	const [answerRange, setAnswerRange] = useState<AnswerRange>("education");
	const [answerKanji, setAnswerKanji] = useState<string>("");
	const [guessedKanjis, setGuessedKanjis] = useState<string[]>([]);
	const [guessCount, setGuessCount] = useState<number>(0);
	const [similarityResults, setSimilarityResults] = useState<SimilarityResult[]>([]);
	const [inputValue, setInputValue] = useState<string>("");
	const [gameState, setGameState] = useState<GameState>("loading");
	const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage>("none");

	const MODEL_VOCAB_URL = "/kanji-vec/kanji_jis1_vocab.txt";
	const MODEL_VECTOR_URL = "/kanji-vec/kanji_jis1_vecs.bin";

	const startNewRound = useCallback(() => {
		const model = kanjiModelRef.current;
		const vocabList = vocabListRef.current[answerRange];
		const vocabArray = Array.from(vocabList);
		const answerIndex = Math.floor(Math.random() * vocabArray.length);
		const answerKanji = vocabArray[answerIndex];
		const answerVec = model.getKanjiVecByChar(answerKanji);
		if (!answerVec) {
			console.error("Failed to get answer Kanji vector");
			return;
		}
		const modelNumWords = model.getNumWords();
		const similarKanjisAndSims = model.calcSimilarKanjis(answerVec, modelNumWords, [answerKanji]);
		if (!similarKanjisAndSims) {
			console.error("Failed to calculate similar Kanjis");
			return;
		}
		setAnswerKanji(answerKanji);
		setGuessCount(0);
		setGuessedKanjis([]);
		setGameState("playing");
		setFeedbackMessage("none");
		setSimilarityResults(similarKanjisAndSims);
	}, [answerRange]);

	useEffect(() => {
		scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [guessCount]);

	useEffect(() => {
		const init = async () => {
			try {
				const loadVocab = async (range: AnswerRange): Promise<Set<string>> => {
					const response = await fetch(VOCAB_URLS[range]);
					const text = await response.text();
					const vocab = text.trim();
					const set = new Set<string>();
					for (const char of vocab) {
						set.add(char);
					}
					return set;
				}
				const [, eduU3Vocab, educationVocab, jis1Vocab] = await Promise.all([
					kanjiModelRef.current.loadData(MODEL_VOCAB_URL, MODEL_VECTOR_URL),
					loadVocab("edu_u3"),
					loadVocab("education"),
					loadVocab("jis1")
				]);
				vocabListRef.current = {
					"edu_u3": eduU3Vocab,
					"education": educationVocab,
					"jis1": jis1Vocab,
				};
				console.log("Kanji model and vocabularies loaded successfully");
				startNewRound();
			}
			catch (error) {
				console.error("Failed to load model or vocabularies:", error);
			}
		}
		init();
	}, [startNewRound]);

	const handleGuess = (kanji: string) => {
		if (gameState !== "playing") {
			return;
		}
		if (guessedKanjis.includes(kanji)) {
			setFeedbackMessage("already_guessed");
			return;
		}
		if (!vocabListRef.current[answerRange].has(kanji)) {
			setFeedbackMessage("invalid_kanji");
			return;
		}

		for (const c of similarityResults.slice(0, guessCount + 1)) {
			if (c.kanji === kanji) {
				setFeedbackMessage("appear_in_ranking");
				return;
			}
		}

		if (kanji === answerKanji) {
			setGameState("result");
		}
		else {
			const newGuessCount = guessCount + 1;
			setGuessCount(newGuessCount);
			setGuessedKanjis([...guessedKanjis, kanji]);
		}
		setFeedbackMessage("none");
	}
	const handleGiveUp = () => {
		if (gameState !== "playing") {
			return;
		}
		setGameState("gave_up");
		setFeedbackMessage("none");
	}
	return (
		<>
			<h1 className="title">fastText 類似度漢字当てゲーム 2</h1>
			<div className="introduction">
				漢字当てゲームです．<br />
				推測する度にランキングが公開されていきます．<br />
				正解の漢字を当てましょう．<br />
				開発記事は<Link href="/blog/kanji-guess-2">こちら</Link>から．
			</div>
			<div className="kanji-guess-2-container">
				<div className="settings-form">
					<fieldset>
						<legend>答えの範囲</legend>
						<label>
							<input
								type="radio"
								value="edu_u3"
								checked={answerRange === "edu_u3"}
								onChange={(e) => setAnswerRange(e.target.value as AnswerRange)}
							/>
							小学校 3 年生以下で習う漢字
						</label>
						<label>
							<input
								type="radio"
								value="education"
								checked={answerRange === "education"}
								onChange={(e) => setAnswerRange(e.target.value as AnswerRange)}
							/>
							教育漢字（小学校 6 年生以下）
						</label>
						<label>
							<input
								type="radio"
								value="jis1"
								checked={answerRange === "jis1"}
								onChange={(e) => setAnswerRange(e.target.value as AnswerRange)}
							/>
							JIS 第 1 水準漢字
						</label>
					</fieldset>
					<button className="start-button" onClick={startNewRound} disabled={gameState === "loading"}>
						新しいゲームを開始
					</button>
				</div>
				<div className="game-section">
					{
						(gameState === "gave_up" || gameState === "result") && (
							<div className={"answer-info " + (gameState === "gave_up" ? "gave-up" : "result")}>
								{(gameState === "gave_up" ? "ギブアップ　" : "") + `正解：${answerKanji}`}
							</div>
						)
					}
					<div className="similarity-ranking">
						<div className="ranking-table-header">
							<span className="label-kanji">漢字</span>
							<span className="label-sim">類似度</span>
						</div>
						{
							similarityResults.slice(0, guessCount + 1).map((result, index) => {
								const percentage = Math.max(0, result.similarity) * 100;
								const hue = Math.min(120, Math.max(0, (result.similarity - 0.2) * 200));
								return (
									<div key={`${answerKanji}-${index}`} className="ranking-item">
										<div className="ranking-header">
											<div className="ranking-kanji">{result.kanji}</div>
											<div className="ranking-similarity">{result.similarity.toFixed(2)}</div>
										</div>
										<div className="similarity-bar-container">
											<div className="similarity-bar" style={{ width: `${percentage}%`, backgroundColor: `hsl(${hue}, 70%, 50%)` }}>
											</div>
										</div>
									</div>
								);
							})
						}
					</div>
				</div>
				<div className="guess-info">
					{`推測回数: ${guessCount + (gameState === "result" ? 1 : 0)} 回`}
				</div>
				<div className="input-section" ref={scrollEndRef}>
					<input
						type="text"
						placeholder="入力"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								if (inputValue.length === 1) {
									handleGuess(inputValue);
									setInputValue("");
								}
							}
						}}
						disabled={gameState !== "playing"}
					/>
					<button onClick={() => {
						handleGuess(inputValue);
						setInputValue("");
					}}
						disabled={gameState !== "playing" && inputValue.length !== 1}
						className="guess-button">
						推測
					</button>
					<button onClick={handleGiveUp} disabled={gameState !== "playing"} className="give-up-button">
						ギブアップ
					</button>
				</div>
				<div className="feedback-message">
					{FEEDBACK_MESSAGES[feedbackMessage]}
				</div>
			</div>
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>語彙リスト</strong>
					<br />
					小学校 3 年生以下で習う漢字，教育漢字，ＪＩＳ第１水準漢字を使用しています．
					<Link href="https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f">教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita</Link>上のリストを使用しています（閲覧日：2026 年 4 月 18 日）．
				</li>
				<li>
					<strong>単語ベクトル</strong>
					<br />
					<Link href="https://fasttext.cc">fastText</Link> の学習済みモデル（Japanese，bin）を加工して使用しています．
					ライセンス：<Link href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</Link>
					<br />
					出典：Grave, E., Bojanowski, P., Gupta, P., Joulin, A., & Mikolov, T. (2018). Learning Word Vectors for 157 Languages. <i>Proceedings of the International Conference on Language Resources and Evaluation (LREC 2018)</i>.<br />
				</li>
			</div>
		</>
	)
}
