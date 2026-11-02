export const CATEGORIES = [
	{ slug: 'tech', label: '技术' },
	{ slug: 'life', label: '生活' },
	{ slug: 'thoughts', label: '思考' },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryLabel = Category['label'];

export const categoryByLabel = (label: string): Category =>
	CATEGORIES.find((category) => category.label === label) ?? CATEGORIES[0];

export const categoryBySlug = (slug: string): Category | undefined =>
	CATEGORIES.find((category) => category.slug === slug);

/** 2026-04-21 */
export const formatDate = (date: Date): string => {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
};

const CJK_PATTERN = /[\u4e00-\u9fa5]/g;
const WORD_PATTERN = /[A-Za-z0-9_]+/g;

/** 中文 400 字/分钟、西文 220 词/分钟。 */
export const readingTime = (body: string | undefined): number => {
	if (!body) return 1;

	const cjk = (body.match(CJK_PATTERN) ?? []).length;
	const words = (body.match(WORD_PATTERN) ?? []).length;

	return Math.max(1, Math.round(cjk / 400 + words / 220));
};

/** 按发布时间倒序 */
export const sortByDate = <T extends { data: { date: Date } }>(posts: T[]): T[] =>
	[...posts].sort((first, second) => second.data.date.getTime() - first.data.date.getTime());
