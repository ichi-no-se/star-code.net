import Link from 'next/link';
import { getPostSlugs, getPostData } from './blogLoader';
import '@styles/blog.css';

export default function BlogPage() {
	const slugs = getPostSlugs();
	const posts = slugs.map((slug) => {
		const { title, date, order } = getPostData(slug);
		return { slug, title, date, order };
	});
	const sortedPosts = posts.sort((a, b) => b.order - a.order);

	return (
		<main>
			<h1 className="title">Blog</h1>
			<ol className="post-list">
				{sortedPosts.map((post) => (
					<Link href={`/blog/${post.slug}`} key={post.slug} className="post-box">
						<div>
							<h2 className="post-title">{post.title}</h2>
							<p className="post-date">{post.date}</p>
						</div>
					</Link>
				))}
			</ol>
		</main>
	);
}
