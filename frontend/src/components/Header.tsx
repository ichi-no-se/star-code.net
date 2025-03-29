import Link from 'next/link';

const Header = () => {
	return (
		<header className="flex justify-between w-full bg-gradient-to-r from-blue-800 to-purple-800 p-4 text-white">
			<h1 className="text-2xl font-bold">star-code.net</h1>
			<nav>
				<ul className="flex space-x-4">
					<Link href="/" className="hover:text-gray-400">Home</Link>
					<Link href="/about" className="hover:text-gray-400">About</Link>
					<Link href="/blog" className="hover:text-gray-400">Blog</Link>
					<Link href="/projects" className="hover:text-gray-400">Projects</Link>
				</ul>
			</nav>
		</header>
	);
}

export default Header;