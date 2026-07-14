'use client';

import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import Script from 'next/script';
import '@styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const fullScreenPages = ['/projects/online-game-prototype-1', '/projects/ghost-tag'];
	const isFullScreen = fullScreenPages.includes(pathname);

	const UmamiScript = () => (
		<Script defer src="https://analytics.star-code.net/script.js" data-website-id="3448b007-5976-4b88-9186-afeb36c14f9a" />
	);

	if (isFullScreen) {
		return (
			<html lang="ja">
				<UmamiScript />
				<body className="fullscreen-body">
					<main className="fullscreen-main">{children}</main>
				</body>
			</html>
		);
	}
	return (
		<html lang="ja">
			<UmamiScript />
			<body className="standard-body">
				<Header />
				<main className="standard-main">{children}</main>
			</body>
		</html>
	);
}
