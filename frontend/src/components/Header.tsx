import Link from 'next/link';

const Header = () => {
	return (
		<header>
			<h1><Link href="/">star-code.net</Link></h1>
			<nav>
				<ul>
					<li><Link href="/blog/about" className="header-link">About</Link></li>
					<li><Link href="/blog" className="header-link">Blog (Tech)</Link></li>
					<li><Link href="/blog2" className="header-link">Blog (Others)</Link></li>
					<li><Link href="/projects" className="header-link">Projects</Link></li>
				</ul>
			</nav>
		</header>
	);
}

export default Header;
