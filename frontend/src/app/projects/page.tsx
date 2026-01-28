import Link from 'next/link';
import '@styles/projects.css';
export default function ProjectsPage() {
	return (
		<main>
			<h1 className="title">Projects</h1>
			<ol className="post-list">
				<Link href="/projects/oblate" className="post-box">
					<div>
						<h2 className="post-title">言葉をオブラートに包む</h2>
						<p className="post-date">2026-01-28</p>
						<p className="post-description">オブ言葉ラート</p>
					</div>
				</Link>
				<Link href="/projects/circle-splatting" className="post-box">
					<div>
						<h2 className="post-title">図形による画像近似</h2>
						<p className="post-date">2026-01-03</p>
						<p className="post-description">画像を色付き図形の集合で近似</p>
					</div>
				</Link>
				<Link href="/projects/reversi-static-ai" className="post-box">
					<div>
						<h2 className="post-title">リバーシ（vs 静的 AI）</h2>
						<p className="post-date">2025-12-04</p>
						<p className="post-description">静的な優先度マップに基づいて動作する AI と対戦</p>
					</div>
				</Link>
				<Link href="/projects/reversi-global" className="post-box">
					<div>
						<h2 className="post-title">全世界同期リバーシ</h2>
						<p className="post-date">2025-12-04</p>
						<p className="post-description">全ての閲覧者と盤面をリアルタイム共有</p>
					</div>
				</Link>
				<Link href="/projects/reversi-local" className="post-box">
					<div>
						<h2 className="post-title">リバーシ（シンプル）</h2>
						<p className="post-date">2025-12-04</p>
						<p className="post-description">シンプルなリバーシ盤，一人二役でも，誰かと同じ PC で対戦でも</p>
					</div>
				</Link>
				<Link href="/projects/legions-path" className="post-box">
					<div>
						<h2 className="post-title">Legion&apos;s Path</h2>
						<p className="post-date">2025-11-16</p>
						<p className="post-description">操作は「線を引く」だけ，リアルタイムストラテジーゲーム</p>
					</div>
				</Link>
				<Link href="/projects/image-ascii-art" className="post-box">
					<div>
						<h2 className="post-title">画像アスキーアート化</h2>
						<p className="post-date">2025-08-10 </p>
						<p className="post-description">画像をアスキーアートに変換する</p>
					</div>
				</Link>
				<Link href="/projects/pixel-rearrange" className="post-box">
					<div>
						<h2 className="post-title">画像ピクセル並び替え</h2>
						<p className="post-date">2025-08-07</p>
						<p className="post-description">画像をピクセルでバラバラにして並び替える</p>
					</div>
				</Link>
				<Link href="/projects/word2vec-guess-v2" className="post-box">
					<div>
						<h2 className="post-title">Word2Vec 類似度単語当てゲーム V2</h2>
						<p className="post-date">2025-07-20</p>
						<p className="post-description">類似度の順位から単語を当てるゲーム</p>
					</div>
				</Link>
				<Link href="/projects/shiny-pokemon" className="post-box">
					<div>
						<h2 className="post-title">ポケモン色違い抽選シミュレーター</h2>
						<p className="post-date">2025-06-22</p>
						<p className="post-description">4096 分の 1 の奇跡</p>
					</div>
				</Link>
				<Link href="/projects/emoji-generator" className="post-box">
					<div>
						<h2 className="post-title">絵文字ジェネレーター</h2>
						<p className="post-date">2025-06-18</p>
						<p className="post-description">Slack や Discord で使える絵文字を生成</p>
					</div>
				</Link>
				<Link href="/projects/digit-classification" className="post-box">
					<div>
						<h2 className="post-title">手書き数字分類</h2>
						<p className="post-date">2025-06-02</p>
						<p className="post-description">機械学習による手書き数字分類のデモ</p>
					</div>
				</Link>
				<Link href="/blog/minecraft-server" className="post-box">
					<div>
						<h2 className="post-title">Minecraft サーバー</h2>
						<p className="post-date">2025-05-31</p>
						<p className="post-description">72 時間でリセットされる Minecraft サーバー</p>
					</div>
				</Link>
				<Link href="/projects/sudoku" className="post-box">
					<div>
						<h2 className="post-title">数独ソルバー</h2>
						<p className="post-date">2025-05-23</p>
						<p className="post-description">（かなり）高速に動作する数独ソルバー</p>
					</div>
				</Link>
				<Link href="/projects/15sec-chat" className="post-box">
					<div>
						<h2 className="post-title">15 秒チャット</h2>
						<p className="post-date">2025-04-04</p>
						<p className="post-description">15 秒でメッセージが消えるチャット</p>
					</div>
				</Link>
			</ol>
		</main>
	);
}
