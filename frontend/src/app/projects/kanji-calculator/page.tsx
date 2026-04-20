"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FastTextKanji, SimilarityResult } from "@/lib/FastTextKanji";
import "@styles/kanji-calculator.css";

type CalcError =
	| { type: "MODEL_NOT_LOADED" }
	| { type: "EMPTY" }
	| { type: "UNKNOWN_CHARS", chars: string[] }
	| { type: "INVALID_FORMULA" }
	| { type: "DIVIDE_BY_ZERO" }
	| { type: "UNEXPECTED" }
	| { type: "NAN_OR_INFINITY" }
	| { type: "ZERO_VECTOR" }
	| null;


type EvaluateResult =
	| { type: "SUCCESS", value: CalcValue }
	| { type: "ERROR", error: CalcError }

type Token =
	| { type: 'SCALAR', value: number }
	| { type: 'VECTOR', value: Float32Array }
	| { type: 'SYMBOL', value: '+' | '-' | '*' | '/' | '(' | ')' };

type CalcValue =
	| { type: "SCALAR", value: number }
	| { type: "VECTOR", value: Float32Array }


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

function evaluateFormula(formula: string, model: FastTextKanji): EvaluateResult {
	// tokenize
	const validSymbols = "+-*/()";
	const numberSymbols = "0123456789.";
	// 空白の除去・invalidCharsの収集
	const cleanFormula = formula.replace(/\s/g, "");
	if (cleanFormula.length === 0) {
		return { type: "ERROR", error: { type: "EMPTY" } };
	}
	const invalidChars: string[] = [];
	for (const char of cleanFormula) {
		if (!validSymbols.includes(char) && !model.isKanjiInVocab(char) && !numberSymbols.includes(char)) {
			invalidChars.push(char);
		}
	}
	if (invalidChars.length > 0) {
		return { type: "ERROR", error: { type: "UNKNOWN_CHARS", chars: invalidChars } };
	}

	const tokens: Token[] = [];
	for (let i = 0; i < cleanFormula.length; i++) {
		const char = cleanFormula[i];
		if (validSymbols.includes(char)) {
			tokens.push({ type: 'SYMBOL', value: char as '+' | '-' | '*' | '/' | '(' | ')' });
		}
		else if (model.isKanjiInVocab(char)) {
			const vec = model.getKanjiVecByChar(char);
			if (!vec) {
				return { type: "ERROR", error: { type: "UNEXPECTED" } };
			}
			tokens.push({ type: 'VECTOR', value: vec });
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
			// ここには来ないはず
			return { type: "ERROR", error: { type: "UNEXPECTED" } };
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
	return { type: "SUCCESS", value: valueStack[0] };
}


function calcVecFromFormula(formula: string, model: FastTextKanji): [CalcValue | null, CalcError] {
	const result = evaluateFormula(formula, model);
	if (result.type === "ERROR") {
		return [null, result.error];
	}
	if (result.value.type === "SCALAR") {
		if (isNaN(result.value.value) || !isFinite(result.value.value)) {
			return [null, { type: "NAN_OR_INFINITY" }];
		}
		return [result.value, null];
	}
	else {
		const norm = Math.sqrt(result.value.value.reduce((sum, x) => sum + x * x, 0));
		if (norm < 1e-8) {
			return [null, { type: "ZERO_VECTOR" }];
		}
		if (isNaN(norm) || !isFinite(norm)) {
			return [null, { type: "NAN_OR_INFINITY" }];
		}
		return [result.value, null];
	}
}

export default function KanjiCalculatorPage() {
	const modelRef = useRef<FastTextKanji | null>(null);
	const [formulaText, setFormulaText] = useState<string>("");
	const [numberOfResults, setNumberOfResults] = useState<number>(36);
	const [results, setResults] = useState<SimilarityResult[]>([]);
	const [scalarResult, setScalarResult] = useState<number | null>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [error, setError] = useState<CalcError>(null);


	useEffect(() => {
		const model = new FastTextKanji();
		model.loadData("/kanji-vec/kanji_jis1_vocab.txt", "/kanji-vec/kanji_jis1_vecs.bin").then(() => {
			modelRef.current = model;
			setIsLoaded(true);
		});
	}, []);

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
		const [value, calcError] = calcVecFromFormula(formulaText, modelRef.current);
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
		const results = modelRef.current.calcSimilarKanjis(value.value, numberOfResults) || [];
		setResults(results);
	}, [formulaText, numberOfResults, isLoaded]);

	const getErrorMessage = (error: CalcError): string => {
		if (!error) return "";
		switch (error.type) {
			case "MODEL_NOT_LOADED":
				return "モデルを読み込んでいます...";
			case "EMPTY":
				return "式を入力してください";
			case "UNKNOWN_CHARS":
				return `次の文字は使用できません: ${error.chars.join("")}`;
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
			<h1 className="title">漢数電卓</h1>
			<div className="introduction">
				入力した漢字式から，fastText の単語ベクトルを使って類似漢字を計算するアプリです．<br />
				開発記事は<Link href="/blog/kanji-calculator">こちら</Link>から．<br /><br />
				使用できる演算子：<code>+ - * / ( )</code><br />
				例：<code>仏-(英+独)/2.0</code><br /><br />
				ＪＩＳ第１水準漢字に対応しています．
			</div>
			<div className="layout-container">
				<div className="input-container">
					<label>
						<span className="input-label">漢字式：</span>
						<input type="text" id="kanji-input" placeholder="ここに入力" value={formulaText} onChange={(e) => setFormulaText(e.target.value)} className="kanji-input-area" />
					</label>
					<label>
						<span className="input-label">表示件数：</span>
						<input type="number" min={1} max={1000} id="number-input" value={numberOfResults} onChange={(e) => setNumberOfResults(parseInt(e.target.value))} className="number-input-area" />
					</label>
				</div>
				{error && error.type !== "EMPTY" && (
					<div className="error-message">
						{getErrorMessage(error)}
					</div>
				)}
				{scalarResult !== null && (
					<div className="scalar-result">
						<span className="result-scalar-label">計算結果：</span>
						<span className="result-scalar-value">{scalarResult}</span>
					</div>
				)}
				<div className="result-container">
					{results.map((result, index) => (
						<div key={index} className="result-item" style={{ backgroundColor: `rgba(50, 200, 80, ${Math.max(0, Math.min(1, result.similarity))})` }}>
							<span className="result-kanji">{result.kanji}</span>
							<span className="result-similarity">{result.similarity.toFixed(4)}</span>
						</div>
					))}
				</div>
			</div>
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>語彙リスト</strong>
					<br />
					ＪＩＳ第１水準漢字を使用しています．
					<Link href="https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f">教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita</Link>上のリストを使用しています（閲覧日：2026 年 4 月 15 日）．
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