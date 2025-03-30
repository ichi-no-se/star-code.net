import Header from '../components/Header';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<body className="bg-gradient-to-r from-blue-50 to-purple-50 min-h-screen flex flex-col">
				<Header />
				<main>{children}</main>
			</body>
		</html>
	);
}
