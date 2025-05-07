import Link from 'next/link';
import '@styles/projects.css';
export default function ProjectsPage() {
	return (
		<main>
			<h1 className="title">Projects</h1>
			<ol className="post-list">
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
