import { getPostSlugs, getPostData } from '../blogLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import '../blog.css';


export default async function BlogPost({ params }: { params: { slug: string } }) {
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
	// TODO 一つ前と一つ後の記事を探すコードを書く
	const { title, date, content } = getPostData(slug);
	return (
		<main className="article">
			<h1 className="article-title">{title}</h1>
			<p className="article-date">{date}</p>
			<div className="article-content">
			<ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} >{content}</ReactMarkdown>
			</div>
		</main>
	);
}
