import Link from 'next/link';
import path from 'path';
import { getPostSlugs, getPostData } from '@/lib/blogLoader';
import '@styles/blog.css';


export default function BlogPage() {
	const postsDirectory = path.join(process.cwd(), 'src', 'app', 'blog', 'posts');
	const slugs = getPostSlugs(postsDirectory);
	const posts = slugs.map((slug) => {
		const { title, date, order } = getPostData(postsDirectory, slug);
		return { slug, title, date, order };
	});
	const sortedPosts = posts.sort((a, b) => b.order - a.order);

	return (
		<>
			<h1 className="title">Blog (Tech)</h1>
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
		</>
	);
}
