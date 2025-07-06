"use client";
import Link from "next/link";
import Word2VecGuess from "@/components/Word2VecGuess";
import "@styles/word2vec-guess.css";


export default function Word2VecGuessPage() {
	

	return (
		<main>
			<h1 className="title">Word2Vec 類似度単語当てゲーム</h1>
			<div className="introduction">
				Word2Vec の類似度を利用した単語当てゲームです．開発記事は<Link href="/blog/word2vec-guess">こちら</Link>から．
			</div>
			<Word2VecGuess />
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>語彙リスト</strong><br />
					<Link href="https://ja.wiktionary.org/wiki/Wiktionary:%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E5%9F%BA%E6%9C%AC%E8%AA%9E%E5%BD%991000">Wiktionary:日本語の基本語彙1000</Link>を加工して使用しています（閲覧日：2025 年 6 月 29 日）．
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
		</main>
	)

}