"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FastTextKanji, SimilarityResult } from "@/lib/FastTextKanji";


type CalcError =
	| { type: "MODEL_NOT_LOADED" }
	| { type: "EMPTY" }
	| { type: "UNKNOWN_CHARS", chars: string[] }
	| { type: "INVALID_FORMULA" }
	| null;

function calcVecFromFormula(formula: string, model: FastTextKanji): [Float32Array, CalcError] {
	// TODO ちゃんとする
	// TODO エラーハンドリングもする
	// 今は漢字一文字の場合のみ対応（テスト）	
	if (formula.length !== 1) {
		console.error("Invalid formula");
		return [new Float32Array(), { type: "INVALID_FORMULA" }];
	}
	const char = formula[0];
	const vec = model.getKanjiVecByChar(char);
	if (!vec) {
		return [new Float32Array(), { type: "UNKNOWN_CHARS", chars: [char] }];
	}
	return [vec, null];
}
export default function KanjiSimilarityPage() {
	const modelRef = useRef<FastTextKanji | null>(null);
	const [formulaText, setFormulaText] = useState<string>("");
	const [numberOfResults, setNumberOfResults] = useState<number>(10);
	const [results, setResults] = useState<SimilarityResult[]>([]);
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
			console.error("Model not loaded");
			setError({ type: "MODEL_NOT_LOADED" });
			return;
		}
		if(formulaText.trim() === "") {
			setResults([]);
			setError({ type: "EMPTY" });
			return;
		}
		const [vec, calcError] = calcVecFromFormula(formulaText, modelRef.current);
		setError(calcError);
		if (calcError) {
			setResults([]);
			return;
		}
		const results = modelRef.current.calcSimilarKanjis(vec, numberOfResults) || [];
		setResults(results);
	}, [formulaText, numberOfResults, isLoaded]);


	return (
		<>
			<h1 className="title">漢字電卓</h1>
			<div className="introduction">
				ここに説明を書きます．<br />

				ＪＩＳ第１水準漢字に対応しています．
			</div>
			<div className="layout-container">
				<div className="input-container">
					<label>
						<span className="input-label">漢字：</span>
						<input type="text" id="kanji-input" placeholder="ここに入力" value={formulaText} onChange={(e) => setFormulaText(e.target.value)} className="kanji-input-area" />
					</label>
					<label>
						<span className="input-label">表示件数：</span>
						<input type="number" min={1} max={1000} id="number-input" value={numberOfResults} onChange={(e) => setNumberOfResults(parseInt(e.target.value))} className="number-input-area" />
					</label>
				</div>
				<div className="result-container">
					{/* TODO そのうち綺麗にする */}
					{results.map((result, index) => (
						<div key={index} className="result-item">
							<span className="result-kanji">{result.kanji}</span>
							<span className="result-similarity">{result.similarity.toFixed(4)}</span>
						</div>
					))}
					{results.length === 0 && <div className="no-result">類似度の高い漢字が見つかりませんでした．</div>}
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