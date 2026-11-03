import type { Category } from './blog';

/** 站点默认时区：文章日期与文件名前缀都按北京时间生成，避免 Vercel 上的 UTC 把日期写早一天 */
const OFFSET_HOURS = 8;
const OFFSET_MS = OFFSET_HOURS * 60 * 60 * 1000;

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * 返回 frontmatter 用的 ISO 时间（带 +08:00）、文件名日期前缀 YYYYMMDD，
 * 以及 HHmm 时间后缀——中文标题生成不出 slug 时靠它区分同一天的多篇。
 */
export const beijingNow = (now: Date = new Date()): { iso: string; dateKey: string; timeKey: string } => {
	const local = new Date(now.getTime() + OFFSET_MS);
	const dateKey = `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}`;
	const timeKey = `${pad(local.getUTCHours())}${pad(local.getUTCMinutes())}`;
	const time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;

	return {
		iso: `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6)}T${time}+08:00`,
		dateKey,
		timeKey,
	};
};

/**
 * YAML 双引号标量：用 JSON.stringify 生成（JSON 字符串是合法的 YAML 双引号标量），
 * 标题里带引号、冒号、井号都不会破坏 frontmatter。
 */
const quote = (value: string): string => JSON.stringify(value);

export interface FrontmatterInput {
	title: string;
	description: string;
	category: Category;
	author?: string;
	series?: string;
	date: string;
	updatedAt?: string;
	draft: boolean;
}

export const buildFrontmatter = (input: FrontmatterInput): string => {
	const lines = [
		'---',
		`title: ${quote(input.title)}`,
		`description: ${quote(input.description)}`,
		`category: ${quote(input.category)}`,
		`author: ${quote(input.author ?? 'Yoxwu')}`,
	];

	if (input.series) lines.push(`series: ${quote(input.series)}`);

	lines.push(`date: ${input.date}`);

	if (input.updatedAt) lines.push(`updatedAt: ${input.updatedAt}`);

	lines.push(`draft: ${input.draft}`, '---', '');

	return lines.join('\n');
};

export const buildMarkdownFile = (input: FrontmatterInput, body: string): string => {
	const content = body.replace(/\r\n/g, '\n').trim();

	return `${buildFrontmatter(input)}\n${content}\n`;
};
