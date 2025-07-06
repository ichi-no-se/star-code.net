import "@styles/word2vec-guess.css";
import { useEffect, useState, useRef, useCallback } from "react";

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

function cosineSimilarity(vecA: number[], vecB: number[]): number {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < vecA.length; i++) {
		dotProduct += vecA[i] * vecB[i];
		normA += vecA[i] * vecA[i];
		normB += vecB[i] * vecB[i];
	}
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10); // Avoid division by zero
}

async function loadData() {
	const wordListResponse = await fetch("/word2vec-guess/word_list.txt");
	if (!wordListResponse.ok) {
		throw new Error("Failed to load word list");
	}
	const wordListText = await wordListResponse.text();
	const words = wordListText.split("\n").map(word => word.trim()).filter(word => word.length > 0);
	const wordVecResponse = await fetch("/word2vec-guess/word_vecs.bin");
	if (!wordVecResponse.ok) {
		throw new Error("Failed to load word vectors");
	}
	const wordVecBuffer = await wordVecResponse.arrayBuffer();
	const dataView = new DataView(wordVecBuffer);
	let offset = 0;
	const numWords = dataView.getInt32(offset, true);
	offset += 4;
	const vecLen = dataView.getInt32(offset, true);
	offset += 4;
	const vecDict: Record<string, number[]> = {};
	for (let i = 0; i < numWords; i++) {
		const word = words[i];
		const vec: number[] = [];
		for (let j = 0; j < vecLen; j++) {
			vec.push(dataView.getFloat32(offset, true));
			offset += 4;
		}
		vecDict[word] = vec;
	}
	return { words, vecDict };
}


export default function Word2VecGuess() {
	const CANDIDATE_WORDS_COUNT = 36;
	const PRE_CANDIDATE_WORDS_COUNT = 100;

	const wordListRef = useRef<string[]>([]);
	const VecDictRef = useRef<Record<string, number[]>>({});
	const [gameState, setGameState] = useState<"loading" | "playing" | "result">("loading");
	const [candidateWords, setCandidateWords] = useState<string[]>([]);
	const [isSelected, setIsSelected] = useState<boolean[]>([]);
	const [rankMap, setRankMap] = useState<number[]>([]);
	const [answerWord, setAnswerWord] = useState<string>("");
	const [guessCount, setGuessCount] = useState(0);

	let content;

	function startNewRound() {
		// 抽選
		const randomIndex = getRandomInt(wordListRef.current.length);
		const answerWord = wordListRef.current[randomIndex];
		setAnswerWord(answerWord);
		const answerVec = VecDictRef.current[answerWord];
		const wordList = wordListRef.current;
		wordList.sort((a, b) => {
			const vecA = VecDictRef.current[a];
			const vecB = VecDictRef.current[b];
			const simA = cosineSimilarity(answerVec, vecA);
			const simB = cosineSimilarity(answerVec, vecB);
			return simB - simA;
		})
		const preCandidateWords = wordList.slice(1, PRE_CANDIDATE_WORDS_COUNT);
		const candidateWords = shuffleArray(preCandidateWords).slice(0, CANDIDATE_WORDS_COUNT - 1);
		candidateWords.push(answerWord);
		const candidateWordsShuffled = shuffleArray(candidateWords);
		setCandidateWords(candidateWordsShuffled);
		const similarityScores = candidateWordsShuffled.map(word => {
			const vec = VecDictRef.current[word];
			return cosineSimilarity(answerVec, vec);
		});
		const rank = similarityScores.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score).map(item => item.index);
		console.log(rank);
		const rankMap = new Array(CANDIDATE_WORDS_COUNT).fill(0);
		for (let i = 0; i < rank.length; i++) {
			rankMap[rank[i]] = i + 1;
		}
		setRankMap(rankMap);
		setIsSelected(new Array(CANDIDATE_WORDS_COUNT).fill(false));
		setGuessCount(0);
		setGameState("playing");
	}

	const handleStartGame = useCallback(() => {
		if (wordListRef.current.length === 0 || Object.keys(VecDictRef.current).length === 0) {
			loadData().then(data => {
				wordListRef.current = data.words;
				VecDictRef.current = data.vecDict;
				startNewRound();
			}).catch(error => {
				console.error("Error loading data:", error);
			});
		}
		else {
			startNewRound();
		}
	}, [])

	function handleGuess(index: number) {
		if (gameState !== "playing") return;
		const newIsSelected = [...isSelected];
		newIsSelected[index] = true;
		setIsSelected(newIsSelected);
		if (candidateWords[index] === answerWord) {
			setGameState("result");
		}
		setGuessCount(prevCount => prevCount + 1);
	}

	useEffect(() => {
		handleStartGame();
	}, [handleStartGame]);

	if (gameState === "loading") {
		content = <div>読み込み中</div>
	}
	else if (gameState === "playing") {
		content = (
			<>
				<div className="guess-info">
					{`推測回数: ${guessCount} 回`}
				</div>
				<div className="panel-grid">
					{
						candidateWords.map((word, index) => {
							return (
								<button key={word}
									className={`word-panel ${isSelected[index] ? "selected" : "unselected"}`}
									onClick={() => handleGuess(index)}
									disabled={isSelected[index]}
								>
									<div className="panel-word">
										{word}
									</div>
									<div className="panel-rank">
										{isSelected[index] ? `${rankMap[index]}/${CANDIDATE_WORDS_COUNT}` : ""}
									</div>
								</button>
							)
						})
					}
				</div>
				<div className="hidden-result">
					<div className="answer-info">
						{`正解の単語`}
					</div>
					<button className="restart-button"
						onClick={handleStartGame}>リスタート</button>
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
						candidateWords.map((word, index) => {
							return (
								<div key={word}
									className={`result-word-panel ${word === answerWord ? "correct" : isSelected[index] ? "selected" : "unselected"}`}
								>
									<div className="panel-word">
										{word}
									</div>
									<div className="panel-rank">
										{rankMap[index]}/{CANDIDATE_WORDS_COUNT}
									</div>
								</div>
							)
						})
					}
				</div>
				<div className="answer-info">
					{`正解の単語: ${answerWord}`}
				</div>
				<button className="restart-button"
					onClick={handleStartGame}>リスタート</button>
			</>
		)
	}
	return (
		<div className="word2vec-guess-container">
			{content}
		</div>
	)
}