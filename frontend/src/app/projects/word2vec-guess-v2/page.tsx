"use client";
import Link from "next/link";
import Word2VecGuess from "@/components/Word2VecGuess";
import "@styles/word2vec-guess.css";


export default function Word2VecGuessPage() {


	return (
		<>
			<h1 className="title">Word2Vec 類似度単語当てゲーム V2</h1>
			<div className="introduction">
				表示されている単語の中に正解が 1 つあります．
				<br />
				単語を選ぶと，正解との近さに基づく順位が表示されます．
				正解の単語（1 位の単語）を見つけましょう．
				<br />
				開発記事は<Link href="/blog/word2vec-guess-v2">こちら</Link>から．
				初期版は<Link href="/projects/word2vec-guess">こちら</Link>から．
			</div>
			<Word2VecGuess wordListURL="/word2vec-guess/word_list_v2.txt" wordVecURL="/word2vec-guess/word_vecs_v2.bin" />
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>単語ベクトル</strong><br />
					<Link href="https://github.com/WorksApplications/chiVe">chiVe: Sudachi による日本語単語ベクトル</Link>
					の <code>v1.3 mc90</code> モデルを加工して使用しています．<br />
					これは，<Link href="https://www.worksap.co.jp">株式会社ワークスアプリケーションズ</Link>によって提供されており，
					<Link href="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</Link>の下で配布されています．
				</li>
			</div>
		</>
	)

}
