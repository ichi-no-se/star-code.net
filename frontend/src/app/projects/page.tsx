import Link from 'next/link';
import '@styles/projects.css';
export default function ProjectsPage() {
	return (
		<main>
			<h1 className="title">Projects</h1>
			<ol className="post-list">
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
