import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string().min(1),
		author: z.string().min(1).default('Yoxwu'),
		/** 内容分类，决定导航归属；必填，避免漏写后静默归到某一类 */
		category: z.enum(['技术', '生活', '思考']),
		series: z.string().min(1).optional(),
		date: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog };
