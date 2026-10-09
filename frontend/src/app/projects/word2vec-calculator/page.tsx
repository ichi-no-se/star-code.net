"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Word2Vec from "@/lib/Word2Vec";
import "@styles/kanji-calculator.css";
import "@styles/word2vec-calculator.css";

type CalcError =
	| { type: "MODEL_NOT_LOADED" }
	| { type: "EMPTY" }
	| { type: "UNKNOWN_WORD", word: string }
	| { type: "INVALID_FORMULA" }
	| { type: "DIVIDE_BY_ZERO" }
	| { type: "UNEXPECTED" }
	| { type: "NAN_OR_INFINITY" }
	| { type: "ZERO_VECTOR" }
	| null;


type EvaluateResult =
	| { type: "SUCCESS", value: CalcValue, words?: string[] }
	| { type: "ERROR", error: CalcError }

type Token =
	| { type: 'SCALAR', value: number }
	| { type: 'VECTOR', value: Float32Array }
	| { type: 'SYMBOL', value: '+' | '-' | '*' | '/' | '(' | ')' };

type CalcValue =
	| { type: "SCALAR", value: number }
	| { type: "VECTOR", value: Float32Array }

type SimilarityResult = {
	word: string;
	similarity: number;
};

type Operators = '+' | '-' | '*' | '/' | 'POS' | 'NEG' | '(';

interface OperatorInfo {
	precedence: number;
	isUnary: boolean;
}

const OPERATOR_TABLE: Record<Operators, OperatorInfo> = {
	'(': { precedence: 0, isUnary: false },// '(' は演算子ではないが，スタックに積むため仮想的な演算子として定義
	'+': { precedence: 1, isUnary: false },
	'-': { precedence: 1, isUnary: false },
	'*': { precedence: 2, isUnary: false },
	'/': { precedence: 2, isUnary: false },
	'POS': { precedence: 3, isUnary: true },
	'NEG': { precedence: 3, isUnary: true },
};

function evaluateFormula(formula: string, model: Word2Vec): EvaluateResult {
	// tokenize
	const validSymbols = "+-*/()";
	const numberSymbols = "0123456789.";
	// 空白の除去・invalidCharsの収集
	const cleanFormula = formula.replace(/\s/g, "");
	if (cleanFormula.length === 0) {
		return { type: "ERROR", error: { type: "EMPTY" } };
	}
	const tokens: Token[] = [];
	const words: string[] = [];
	for (let i = 0; i < cleanFormula.length; i++) {
		const char = cleanFormula[i];
		if (validSymbols.includes(char)) {
			tokens.push({ type: 'SYMBOL', value: char as '+' | '-' | '*' | '/' | '(' | ')' });
		}
		else if (numberSymbols.includes(char)) {
			let numStr = "";
			let dotCount = 0;
			while (i < cleanFormula.length && numberSymbols.includes(cleanFormula[i])) {
				if (cleanFormula[i] === ".") {
					dotCount++;
				}
				numStr += cleanFormula[i];
				i++;
			}
			i--;
			if (dotCount > 1 || numStr === ".") {
				return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
			}
			tokens.push({ type: 'SCALAR', value: parseFloat(numStr) });
		}
		else {
			let nextBoundary = i;
			while (
				nextBoundary < cleanFormula.length &&
				!validSymbols.includes(cleanFormula[nextBoundary]) &&
				!numberSymbols.includes(cleanFormula[nextBoundary])
			) {
				nextBoundary++;
			}
			const substring = cleanFormula.substring(i, nextBoundary);
			if (model.isWordInVocab(substring)) {
				const vec = model.getWordVec(substring);
				if (!vec) {
					return { type: "ERROR", error: { type: "UNEXPECTED" } };
				}
				tokens.push({ type: 'VECTOR', value: vec });
				words.push(substring);
				i = nextBoundary - 1;
				continue;
			}
			return { type: "ERROR", error: { type: "UNKNOWN_WORD", word: substring } };
		}
	}

	const valueStack: CalcValue[] = [];
	const operatorStack: Operators[] = [];

	function applyTopOperator(): CalcError {
		const operator = operatorStack.pop();
		if (!operator) {
			return { type: "INVALID_FORMULA" };
		}
		const operatorInfo = OPERATOR_TABLE[operator];
		if (operatorInfo.isUnary) {
			const operand = valueStack.pop();
			if (!operand) {
				return { type: "INVALID_FORMULA" };
			}
			const result = calculateUnaryOperation(operator, operand);
			if (result.type === "ERROR") {
				return result.error;
			}
			else {
				valueStack.push(result.value);
			}
		}
		else {
			const right = valueStack.pop();
			const left = valueStack.pop();
			if (!left || !right) {
				return { type: "INVALID_FORMULA" };
			}
			const result = calculateBinaryOperation(operator, left, right);
			if (result.type === "ERROR") {
				return result.error;
			}
			else {
				valueStack.push(result.value);
			}
		}
		return null;
	}

	function calculateUnaryOperation(operator: Operators, operand: CalcValue): EvaluateResult {
		if (operator === 'POS') {
			return { type: "SUCCESS", value: operand };
		}
		else if (operator === 'NEG') {
			if (operand.type === "SCALAR") {
				return { type: "SUCCESS", value: { type: "SCALAR", value: -operand.value } };
			}
			else if (operand.type === "VECTOR") {
				const negatedVec = new Float32Array(operand.value.length);
				for (let i = 0; i < operand.value.length; i++) {
					negatedVec[i] = -operand.value[i];
				}
				return { type: "SUCCESS", value: { type: "VECTOR", value: negatedVec } };
			}
		}
		return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
	}

	function calculateBinaryOperation(operator: Operators, left: CalcValue, right: CalcValue): EvaluateResult {
		if (left.type === "SCALAR" && right.type === "SCALAR") {
			let value: number;
			switch (operator) {
				case '+':
					value = left.value + right.value;
					break;
				case '-':
					value = left.value - right.value;
					break;
				case '*':
					value = left.value * right.value;
					break;
				case '/':
					if (right.value === 0) {
						return { type: "ERROR", error: { type: "DIVIDE_BY_ZERO" } };
					}
					value = left.value / right.value;
					break;
				default:
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
			}
			return { type: "SUCCESS", value: { type: "SCALAR", value } };
		}
		else if (left.type === "VECTOR" && right.type === "VECTOR") {
			let resultVec: Float32Array;
			switch (operator) {
				case '+':
					resultVec = new Float32Array(left.value.length);
					for (let i = 0; i < left.value.length; i++) {
						resultVec[i] = left.value[i] + right.value[i];
					}
					return { type: "SUCCESS", value: { type: "VECTOR", value: resultVec } };
				case '-':
					resultVec = new Float32Array(left.value.length);
					for (let i = 0; i < left.value.length; i++) {
						resultVec[i] = left.value[i] - right.value[i];
					}
					return { type: "SUCCESS", value: { type: "VECTOR", value: resultVec } };
				default:
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
			}
		}
		else {
			const scalar = left.type === "SCALAR" ? left.value : right.type === "SCALAR" ? right.value : null;
			const vector = left.type === "VECTOR" ? left.value : right.type === "VECTOR" ? right.value : null;
			if (scalar === null || vector === null) {
				return { type: "ERROR", error: { type: "UNEXPECTED" } };
			}
			switch (operator) {
				case '*':
					const scaledVec = new Float32Array(vector.length);
					for (let i = 0; i < vector.length; i++) {
						scaledVec[i] = vector[i] * scalar;
					}
					return { type: "SUCCESS", value: { type: "VECTOR", value: scaledVec } };
				case '/':
					if (scalar === 0) {
						return { type: "ERROR", error: { type: "DIVIDE_BY_ZERO" } };
					}
					const dividedVec = new Float32Array(vector.length);
					for (let i = 0; i < vector.length; i++) {
						dividedVec[i] = vector[i] / scalar;
					}
					return { type: "SUCCESS", value: { type: "VECTOR", value: dividedVec } };
				default:
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
			}
		}
	}

	let expectValue = true;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token.type === 'SCALAR' || token.type === 'VECTOR') {
			if (!expectValue) {
				return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
			}
			valueStack.push(token);
			expectValue = false;
		}
		else if (token.type === 'SYMBOL') {
			const symbol = token.value;
			if (symbol === '(') {
				if (!expectValue) {
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
				}
				operatorStack.push(symbol);
				expectValue = true;
			}
			else if (symbol === ')') {
				if (expectValue) {
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
				}
				while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
					const error = applyTopOperator();
					if (error) {
						return { type: "ERROR", error };
					}
				}
				if (operatorStack.length === 0) {
					return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
				}
				operatorStack.pop(); // '(' を消す
				expectValue = false;
			}
			else {
				// + - * / の処理
				const isUnary = expectValue;
				if (isUnary) {
					// 単項演算子の場合、POS/NEG に変換してスタックに積む
					// 右結合かつ優先順位が最も高いので，ただ push するだけで良い
					switch (symbol) {
						case '+':
							operatorStack.push('POS');
							break;
						case '-':
							operatorStack.push('NEG');
							break;
						default:
							return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
					}
					expectValue = true;
				}
				else {
					const currentOpInfo = OPERATOR_TABLE[symbol];
					while (operatorStack.length > 0) {
						const topOp = operatorStack[operatorStack.length - 1];
						const topOpInfo = OPERATOR_TABLE[topOp];
						if (topOpInfo.precedence >= currentOpInfo.precedence) {
							const error = applyTopOperator();
							if (error) {
								return { type: "ERROR", error };
							}
						}
						else {
							break;
						}
					}
					operatorStack.push(symbol);
					expectValue = true;
				}
			}
		}
		else {
			return { type: "ERROR", error: { type: "UNEXPECTED" } };
		}
	}
	while (operatorStack.length > 0) {
		const error = applyTopOperator();
		if (error) {
			return { type: "ERROR", error };
		}
	}
	if (valueStack.length !== 1) {
		return { type: "ERROR", error: { type: "INVALID_FORMULA" } };
	}
	return { type: "SUCCESS", value: valueStack[0], words: words };
}


function calcVecFromFormula(formula: string, model: Word2Vec): [CalcValue | null, CalcError, string[] | undefined] {
	const result = evaluateFormula(formula, model);
	if (result.type === "ERROR") {
		return [null, result.error, undefined];
	}
	if (result.value.type === "SCALAR") {
		if (isNaN(result.value.value) || !isFinite(result.value.value)) {
			return [null, { type: "NAN_OR_INFINITY" }, undefined];
		}
		return [result.value, null, result.words];
	}
	else {
		const norm = Math.sqrt(result.value.value.reduce((sum, x) => sum + x * x, 0));
		if (norm < 1e-8) {
			return [null, { type: "ZERO_VECTOR" }, undefined];
		}
		if (isNaN(norm) || !isFinite(norm)) {
			return [null, { type: "NAN_OR_INFINITY" }, undefined];
		}
		return [result.value, null, result.words];
	}
}


function calcSimilarWords(model: Word2Vec, vec: Float32Array, numResults: number, excludeList?: string[]): SimilarityResult[] | null {
	const similarities: SimilarityResult[] = [];
	const normalizedVec = new Float32Array(vec.length);
	let norm = 0;
	for (let i = 0; i < vec.length; i++) {
		norm += vec[i] * vec[i];
	}
	norm = Math.sqrt(norm);
	if (norm < 1e-10) {
		return null;
	}
	for (let i = 0; i < vec.length; i++) {
		normalizedVec[i] = vec[i] / norm;
	}
	const excludeIndices = new Set<number>();
	if (excludeList) {
		for (const word of excludeList) {
			const index = model.getWordIndex(word);
			if (index !== null) {
				excludeIndices.add(index);
			}
		}
	}
	for (let i = 0; i < model.getNumWords(); i++) {
		if (excludeIndices.has(i)) {
			continue;
		}
		const wordVec = model.getWordVecByIndex(i);
		if (!wordVec) {
			continue;
		}
		let dotProduct = 0;
		for (let j = 0; j < normalizedVec.length; j++) {
			dotProduct += normalizedVec[j] * wordVec[j];
		}
		similarities.push({ word: model.getWordByIndex(i) || "", similarity: dotProduct });
	}
	similarities.sort((a, b) => b.similarity - a.similarity);
	return similarities.slice(0, numResults);
}

export default function Word2VecCalculatorPage() {
	const modelRef = useRef<Word2Vec | null>(null);
	const [formulaText, setFormulaText] = useState<string>("");
	const [numberOfResults, setNumberOfResults] = useState<number>(50);
	const [results, setResults] = useState<SimilarityResult[]>([]);
	const [scalarResult, setScalarResult] = useState<number | null>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [error, setError] = useState<CalcError>(null);
	const [excludeCurrent, setExcludeCurrent] = useState<boolean>(false);

	const loadWord2VecData = async () => {
		if (isLoaded) {
			return;
		}
		const isConfirmed = confirm("Word2Vec データ（約 20MB）を読み込みますか？");
		if (!isConfirmed) {
			return;
		}
		const word2Vec = new Word2Vec();
		await word2Vec.loadData("/word2vec-common-japanese/words.txt", "/word2vec-common-japanese/word_vecs.bin", true);
		modelRef.current = word2Vec;
		setIsLoaded(true);
	};

	useEffect(() => {
		if (!modelRef.current || !isLoaded) {
			setError({ type: "MODEL_NOT_LOADED" });
			return;
		}
		if (formulaText.trim() === "") {
			setResults([]);
			setError({ type: "EMPTY" });
			return;
		}
		const [value, calcError, words] = calcVecFromFormula(formulaText, modelRef.current);
		setError(calcError);
		if (calcError || !value) {
			setResults([]);
			setScalarResult(null);
			return;
		}
		if (value.type === "SCALAR") {
			setScalarResult(value.value);
			setResults([]);
			return;
		}
		// value.type === "VECTOR"
		setScalarResult(null);
		const excludeList = excludeCurrent ? words : [];
		const results = calcSimilarWords(modelRef.current, value.value, numberOfResults, excludeList) || [];
		setResults(results);
	}, [formulaText, numberOfResults, isLoaded, excludeCurrent]);

	const getErrorMessage = (error: CalcError): string => {
		if (!error) return "";
		switch (error.type) {
			case "MODEL_NOT_LOADED":
				return "モデルを読み込んでいます...";
			case "EMPTY":
				return "式を入力してください";
			case "UNKNOWN_WORD":
				return `未知の単語が含まれています: ${error.word}`;
			case "INVALID_FORMULA":
				return "式の形式が正しくありません";
			case "DIVIDE_BY_ZERO":
				return "0 で割ることはできません";
			case "UNEXPECTED":
				return "予期しないエラーが発生しました";
			case "NAN_OR_INFINITY":
				return "計算結果が無限あるいは非数です";
			case "ZERO_VECTOR":
				return "ベクトルの大きさがゼロです";
			default:
				return "不明なエラーが発生しました";
		}
	}

	return (
		<>
			<h1 className="title">単語ベクトル計算機</h1>
			<div className="introduction">
				入力した漢字式から，<Link href="https://github.com/WorksApplications/chiVe">chiVe</Link> の単語ベクトルを使って類似漢字を計算するアプリです．<br />
				開発記事は<Link href="/blog/word2vec-calculator">こちら</Link>から．<br /><br />
				使用できる演算子：<code>+ - * / ( )</code><br />
				例：<code>フランス-(イギリス+ドイツ)/2.0</code><br /><br />
				単語リストは<Link href="/word2vec-common-japanese/words.txt">こちら</Link>から．
			</div>
			<div className="layout-container">
				<div className="input-container">
					<label>
						<span className="input-label">単語式：</span>
						<input type="text" id="kanji-input" placeholder="ここに入力" value={formulaText} onChange={(e) => setFormulaText(e.target.value)} className="input-area" />
					</label>
					<label>
						<span className="input-label">表示件数：</span>
						<input type="number" min={1} max={1000} id="number-input" value={numberOfResults} onChange={(e) => setNumberOfResults(parseInt(e.target.value))} className="number-input-area" />
					</label>
					<label>
						<input type="checkbox" id="exclude-current" className="exclude-current-checkbox" checked={excludeCurrent} onChange={(e) => setExcludeCurrent(e.target.checked)} />
						<span className="input-label">式に含まれる単語を除外</span>
					</label>
				</div>
				{isLoaded ? (error && error.type !== "EMPTY" && (
					<div className="error-message">
						{getErrorMessage(error)}
					</div>
				)) : <button className="load-model-button" onClick={loadWord2VecData}>モデルを読み込む</button>}
				{scalarResult !== null && (
					<div className="scalar-result">
						<span className="result-scalar-label">計算結果：</span>
						<span className="result-scalar-value">{scalarResult}</span>
					</div>
				)}
				<div className="word-result-container">
					{results.map((result, index) => (
						<div key={index} className="result-item" style={{ backgroundColor: `rgba(50, 200, 80, ${Math.max(0, Math.min(1, result.similarity))})` }}>
							<span className="result-word">{result.word}</span>
							<span className="result-similarity">{result.similarity.toFixed(4)}</span>
						</div>
					))}
				</div>
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
