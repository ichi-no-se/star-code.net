"use client";
import Link from "next/link";
import KanjiGuess from "@/components/KanjiGuess";
import "@styles/kanji-guess.css";

export default function KanjiGuessPage() {
	return (
		<>
			<h1 className="title">fastText 類似度漢字当てゲーム</h1>
			<div className="introduction">
				表示されている漢字の中に正解が 1 つあります．
				<br />
				漢字を選ぶと，正解との近さに基づく順位が表示されます．
				正解の漢字（1 位の漢字）を見つけましょう．
				<br />
				開発記事は<Link href="/blog/kanji-guess">こちら</Link>から．
			</div>
			<KanjiGuess vocabURL="/kanji-vec/kanji_edu_u3_vocab.txt" vectorURL="/kanji-vec/kanji_edu_u3_vecs.bin" />
			<div className="license">
				このアプリでは，以下のデータセット・リソースを使用しています．
				<li>
					<strong>語彙リスト</strong>
					<br />
					小学校 3 年生までで習う漢字を使用しています．
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
