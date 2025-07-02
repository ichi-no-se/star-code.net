"use client";
import Link from "next/link";
import { useState } from "react";
import "@styles/word2vec-guess.css";


export default function Word2VecGuessPage() {
	const [wordList, setWordList] = useState<string[]>([]);
	const [VecDict, setVecDict] = useState<Record<string, number[]>>({});

	async function loadData() {
		const wordListResponse = await fetch("/word2vec-guess/word_list.txt");
		if (!wordListResponse.ok) {
			throw new Error("Failed to load word list");
		}
		const wordListText = await wordListResponse.text();
		const words = wordListText.split("\n").map(word => word.trim()).filter(word => word.length > 0);
		setWordList(words);
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
		setVecDict(vecDict);
	}

	return (
		<main>
			<h1 className="title">Word2Vec 類似度単語当てゲーム</h1>
			<div className="introduction">
				Word2Vec の類似度を利用した単語当てゲームです．
			</div>
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>語彙リスト</strong><br />
					<Link href="https://ja.wiktionary.org/wiki/Wiktionary:%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E5%9F%BA%E6%9C%AC%E8%AA%9E%E5%BD%991000">Wiktionary:日本語の基本語彙1000</Link>を加工して使用しています．
					ライセンス：
					<Link href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</Link>
				</li>
				<li>
					<strong>単語ベクトル</strong><br />
					<Link href="https://github.com/WorksApplications/chiVe">chiVe: Sudachi による日本語単語ベクトル</Link>
					の <code>v1.3 mc90</code> モデルを加工して使用しています．<br />
					これは，<Link href="https://www.worksap.co.jp">株式会社ワークスアプリケーションズ</Link>によって提供されており，
					<Link href="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</Link>の下で配布されています．
				</li>
			</div>
			<input type="button" value="HELLO" onClick={
				() => {
					loadData();
					console.log(wordList);
					console.log(VecDict);
				}
			} />
		</main>
	)

}