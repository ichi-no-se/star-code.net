import Link from 'next/link';

const Header = () => {
	return (
		<header>
			<h1>star-code.net</h1>
			<nav>
				<ul>
					<Link href="/" className="header-link" >Home</Link>
					<Link href="/blog/about" className="header-link">About</Link>
					<Link href="/blog" className="header-link">Blog</Link>
					<Link href="/projects" className="header-link">Projects</Link>
				</ul>
			</nav>
		</header>
	);
}

export default Header;