import { getPostSlugs, getPostData } from '../blogLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import '@styles/blog.css';
import Link from 'next/link';

type BlogProps = {
	params:Promise<{ slug: string }>;	
}

export default async function BlogPost({ params }: BlogProps) {
	const { slug } = await params;
	const slugs = getPostSlugs();
	if (!slugs.includes(slug)) {
		notFound();
	}
	const posts = slugs.map((slug) => {
		const { title, date, order } = getPostData(slug);
		return { slug, title, date, order };
	});
	const sortedPosts = posts.sort((a, b) => b.order - a.order);
	const currentIndex = sortedPosts.findIndex((post) => post.slug === slug);
	const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
	const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
	const { title, date, content } = getPostData(slug);
	return (
		<>
			<main className="article">
				<h1 className="article-title">{title}</h1>
				<p className="article-date">{date}</p>
				<div className="article-content">
					<ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} >{content}</ReactMarkdown>
				</div>
			</main>
			<nav className="article-navigation">
				<div className="article-nav-tiles">
					{prevPost && (
						<Link href={`/blog/${prevPost.slug}`}>
							<div className="article-nav-tile-left">
								<span className="article-nav-tile-label">前の記事</span>
								<br />
								<span className="article-nav-tile-date">{prevPost.date}</span>
								<br />
								<span className="article-nav-tile-title">{prevPost.title}</span>
							</div>
						</Link>
					)}
					{nextPost && (
						<Link href={`/blog/${nextPost.slug}`}>
							<div className="article-nav-tile-right">
								<span className="article-nav-tile-label">次の記事</span>
								<br />
								<span className="article-nav-tile-date">{nextPost.date}</span>
								<br />
								<span className="article-nav-tile-title">{nextPost.title}</span>
							</div>
						</Link>
					)}
					<Link href="/blog">
						<div className="article-nav-tile-center">
							<span className="article-nav-tile-label">ホームに戻る</span>
						</div>
					</Link>
				</div>
			</nav>
		</>
	);
}

export async function generateStaticParams() {
	const slugs = getPostSlugs();
	return slugs.map((slug) => ({
		slug,
	}));
}