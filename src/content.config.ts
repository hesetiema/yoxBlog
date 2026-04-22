import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string().min(1),
		author: z.string().min(1),
		series: z.string().min(1).optional(),
		date: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		cover: z.string().min(1),
		tags: z.array(z.string().min(1)).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog };