/**
 * 写作台与发布接口共用的纯函数（不依赖 Node API，前后端都能引用）。
 */

/** 与 content.config.ts 里的 category 枚举保持一致，改这里要同步改那边 */
export const CATEGORIES = ['技术', '生活', '思考'] as const;

export type Category = (typeof CATEGORIES)[number];

export const isCategory = (value: unknown): value is Category =>
	typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);

/**
 * 从标题生成文件名用的 slug。
 * 只保留 ASCII 字母数字：中文标题会得到空串，此时由调用方退化成 `post`，
 * 同时用户可以在写作台里手动指定 slug。
 */
export const slugify = (input: string): string =>
	input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);

/** 去掉常见 Markdown 标记，取正文开头当摘要（首页、meta description 都用它） */
export const deriveDescription = (body: string, limit = 80): string => {
	const plain = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}#{1,6}\s+/gm, '')
		.replace(/^\s{0,3}>\s?/gm, '')
		.replace(/[*_~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (plain.length <= limit) return plain;
	return `${plain.slice(0, limit).trimEnd()}…`;
};
