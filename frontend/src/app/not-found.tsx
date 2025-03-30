import Link from 'next/link';

export default function NotFound() {
	return (
		<main>
			<h1 className="title">404 - Not Found</h1>
			<p>お探しのページは見つかりませんでした。</p>
			<Link href="/">
				ホームに戻る
			</Link>
		</main>
	);
}