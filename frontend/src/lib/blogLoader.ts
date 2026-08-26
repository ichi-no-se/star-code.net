import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getPostSlugs(postsDirectory: string) {
	return fs.readdirSync(postsDirectory).filter((file: string) => file.endsWith(".md") || file.endsWith(".mdx")).map((file: string) => file.replace(/\.mdx?$/, ''));
}

export function getPostData(postsDirectory: string, slug: string) {
	let fullPath = path.join(postsDirectory, `${slug}.mdx`);
	if (!fs.existsSync(fullPath)) {
		fullPath = path.join(postsDirectory, `${slug}.md`);
	}
	const fileContents = fs.readFileSync(fullPath, 'utf8');
	const { data, content } = matter(fileContents);

	const title = typeof data.title === 'string' ? data.title : 'Untitled';
	const date = typeof data.date === 'string' ? data.date : 'Unknown';
	const order = Number(data.order);

	return {
		slug,
		title,
		date,
		order,
		content
	};
}
