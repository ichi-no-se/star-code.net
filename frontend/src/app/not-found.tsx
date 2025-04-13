import Link from 'next/link';

export default function NotFound() {
	return (
		<main>
			<h1 className="title">404 - Not Found</h1>
			<div className="items-center text-center justify-center">
				<p className="text-4xl pt-8">お探しのページは見つかりませんでした。</p>
				<Link href="/" className="text-blue-500 underline text-4xl pt-8 mt-8 block">
					ホームに戻る
				</Link>
			</div>
		</main>
	);
}