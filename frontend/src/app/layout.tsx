'use client';

import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import '@styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const fullScreenPages = ['/projects/online-game-prototype-1', '/projects/ghost-tag'];
	const isFullScreen = fullScreenPages.includes(pathname);

	if (isFullScreen) {
		return (
			<html lang="ja">
				<body className="fullscreen-body">
					<main className="fullscreen-main">{children}</main>
				</body>
			</html>
		);
	}
	return (
		<html lang="ja">
			<body className="standard-body">
				<Header />
				<main className="standard-main">{children}</main>
			</body>
		</html>
	);
}
