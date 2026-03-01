'use client';

import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import '@styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const fullScreenPages = ['/projects/online-game-prototype-1'];
	const isFullScreen = fullScreenPages.includes(pathname);

	if (isFullScreen) {
		return (
			<html lang="ja">
				<body className="bg-gradient-to-r from-blue-50 to-purple-50 h-screen w-screen overflow-hidden m-0 p-0">
					<main className="h-full w-full">{children}</main>
				</body>
			</html>
		);
	}
	return (
		<html lang="ja">
			<body className="bg-gradient-to-r from-blue-50 to-purple-50 min-h-screen flex flex-col">
				<Header />
				<main>{children}</main>
			</body>
		</html>
	);
}
