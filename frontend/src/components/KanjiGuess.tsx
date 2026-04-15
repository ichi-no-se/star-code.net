import "@styles/kanji-guess.css";
import { FastTextKanji } from "@/lib/FastTextKanji";
import { useState, useEffect, useRef, useCallback } from "react";

function getRandomInt(n: number): number {
	return Math.floor(Math.random() * n);
}

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = getRandomInt(i + 1);
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

type KanjiGuessProps = {
	vocabURL: string;
	vectorURL: string;
};

export default function KanjiGuess({ vocabURL, vectorURL }: KanjiGuessProps) {
	const kanjiModelRef = useRef<FastTextKanji>(new FastTextKanji());	
	const [gameState, setGameState] = useState<"loading"| "playing" | "result">("loading");
	const [candidateKanjis, setCandidateKanjis] = useState<string[]>([]);
	const [isSelected, setIsSelected] = useState<boolean[]>([]);
	const [rankMap, setRankMap] = useState<number[]>([]);
	const [answerKanji, setAnswerKanji] = useState<string>("");
	const [guessCount, setGuessCount] = useState(0);

	const CANDIDATE_KANJI_COUNT = 36;
	const PRE_CANDIDATE_KANJI_COUNT = 50;


	const startNewRound = useCallback(() => {
		const model = kanjiModelRef.current;
		const numWords = model.getNumWords();
		const answerIndex = getRandomInt(numWords);
		const answerKanji = model.getKanji(answerIndex);
		if (!answerKanji) {
			console.error("Failed to get answer Kanji");
			return;
		}
		setAnswerKanji(answerKanji);
		const answerVec = model.getKanjiVec(answerIndex);
		if (!answerVec) {
			console.error("Failed to get answer Kanji vector");
			return;
		}
		const preCandidateKanjisAndSims: { kanji: string, similarity: number }[] | null = model.calcSimilarKanjis(answerVec, PRE_CANDIDATE_KANJI_COUNT);
		if (!preCandidateKanjisAndSims) {
			console.error("Failed to calculate similar Kanjis");
			return;
		}
		// 答えの漢字を一旦候補から除外する
		const filteredPreCandidateKanjisAndSims = preCandidateKanjisAndSims.filter(item => item.kanji !== answerKanji);
		const shuffledPreCandidateKanjisAndSims = shuffleArray(filteredPreCandidateKanjisAndSims);
		const candidateKanjisAndSims = shuffledPreCandidateKanjisAndSims.slice(0, CANDIDATE_KANJI_COUNT - 1);
		// 答えの漢字を最後に追加する
		candidateKanjisAndSims.push({ kanji: answerKanji, similarity: 1 });
		const shuffledCandidateKanjisAndSims = shuffleArray(candidateKanjisAndSims);
		const rank = shuffledCandidateKanjisAndSims.map(item => item.similarity).map((sim, index) => ({ sim, index })).sort((a, b) => b.sim - a.sim).map(item => item.index);
		const rankMap = new Array(CANDIDATE_KANJI_COUNT).fill(0);
		for (let i = 0; i < rank.length; i++) {
			rankMap[rank[i]] = i + 1;
		}
		setRankMap(rankMap);
		setCandidateKanjis(shuffledCandidateKanjisAndSims.map(item => item.kanji));
		setIsSelected(new Array(CANDIDATE_KANJI_COUNT).fill(false));
		setGuessCount(0);
		setGameState("playing");
	}, []);

	useEffect(() => {
		kanjiModelRef.current.loadData(vocabURL, vectorURL).then(() => {
			console.log("Kanji model loaded successfully");
			startNewRound();
			setGameState("playing");
		}).catch((error) => {
			console.error("Failed to load Kanji model:", error);
		});
	}, [vocabURL, vectorURL, startNewRound]);

	function handleGuess(index: number) {
		if (gameState !== "playing" || isSelected[index]) {
			return;
		}
		const newIsSelected = [...isSelected];
		newIsSelected[index] = true;
		setIsSelected(newIsSelected);
		setGuessCount(guessCount + 1);
		if (candidateKanjis[index] === answerKanji) {
			setGameState("result");
		}
	}

	let content;
	if (gameState === "loading") {
		content = <div>読み込み中...</div>;
	}
	else if (gameState === "playing") {
		content = (
			<>
				<div className="guess-info">
					{`推測回数: ${guessCount} 回`}
				</div>
				<div className="panel-grid">
					{
						candidateKanjis.map((kanji, index) => {
							return (
								<button key={kanji}
									className={`kanji-panel ${isSelected[index] ? "selected" : "unselected"}`}
									onClick={() => handleGuess(index)}
									disabled={isSelected[index]}
								>
									<div className="panel-kanji">
										{kanji}
									</div>
									<div className="panel-rank">
										{isSelected[index] ? `${rankMap[index]}/${CANDIDATE_KANJI_COUNT}` : ""}
									</div>
								</button>
							)
						})
					}
				</div>
				<div className="hidden-result">
					<div className="answer-info">
						{`正解の単語: ${answerKanji}`}
					</div>
					<button className="restart-button"
						onClick={startNewRound}>リスタート</button>
				</div>
			</>
		);
	}
	else if (gameState === "result") {
		content = (
			<>
				<div className="guess-info">
					{`推測回数: ${guessCount} 回`}
				</div>
				<div className="result-grid" >
					{
						candidateKanjis.map((kanji, index) => {
							return (
								<div key={kanji}
									className={`result-kanji-panel ${kanji === answerKanji ? "correct" : isSelected[index] ? "selected" : "unselected"}`}
								>
									<div className="panel-kanji">
										{kanji}
									</div>
									<div className="panel-rank">
										{rankMap[index]}/{CANDIDATE_KANJI_COUNT}
									</div>
								</div>
							)
						})
					}
				</div>
				<div className="answer-info">
					{`正解の単語: ${answerKanji}`}
				</div>
				<button className="restart-button"
					onClick={startNewRound}>リスタート</button>
			</>
		)
	}
	return (
		<div className="kanji-guess-container">
			{content}
		</div>
	)
}