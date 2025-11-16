"use client";
import Link from "next/link";
import "@styles/legions-path.css";


export default function LegionsPath() {
	return (
		<main>
				<h1 className="title">Legion&apos;s Path</h1>
				<h2 className="introduction">操作は「線を引く」だけ，リアルタイムストラテジーゲーム<br />
					開発記事は<Link href="/blog/legions-path">こちら</Link>から．<br /><br />
					<strong>操作方法</strong><br />
					<ul>
						<li>ユニットの選択：ドラッグでユニットを囲む</li>
						<li>移動指示：ドラッグで経路を指定</li>
					</ul>

			</h2>
			<div className="game-window">
				<iframe
					src="/legions-path/index.html"
					width="800"
					height="600"
					title="Game Window" />
			</div>
		</main>
	)
}