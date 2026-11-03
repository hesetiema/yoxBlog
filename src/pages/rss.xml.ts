import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortByDate } from '../utils/post';

export const GET: APIRoute = async (context) => {
	const posts = sortByDate(await getCollection('blog', ({ data }) => !data.draft));

	return rss({
		title: 'Yoxwu 的博客',
		description: '记录技术、生活，和一些想明白的事。',
		site: context.site ?? 'https://wuyox.vercel.app',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `/posts/${post.id}`,
			categories: [post.data.category],
		})),
		customData: '<language>zh-CN</language>',
	});
};
