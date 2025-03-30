import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src', 'app', 'blog', 'posts');

export function getPostSlugs() {
	return fs.readdirSync(postsDirectory).filter((file: string)=>file.endsWith(".md")).map((file:string)=>file.replace(".md", ""));
}

export function getPostData(slug: string) {
	const fullPath = path.join(postsDirectory, `${slug}.md`);
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