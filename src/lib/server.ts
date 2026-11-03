import { timingSafeEqual } from 'node:crypto';

/**
 * 读取环境变量：Vercel 运行时走 process.env，本地 astro dev 走 import.meta.env（Astro 会把 .env 注入这里）。
 * 两边都兜一下，避免同一份代码在不同环境下取不到值。
 */
export const readEnv = (key: string): string | undefined => {
	const fromProcess = typeof process === 'undefined' ? undefined : process.env?.[key];
	if (fromProcess) return fromProcess;

	return (import.meta.env as Record<string, string | undefined>)[key];
};

export const json = (data: unknown, status = 200): Response =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
	});

/** 写作台密码校验：定长比较，避免按字符逐位比对泄露信息 */
export const isAuthorized = (request: Request): boolean => {
	const expected = readEnv('ADMIN_PASSWORD');
	if (!expected) return false;

	const provided = request.headers.get('x-admin-key') ?? '';
	const given = Buffer.from(provided, 'utf8');
	const want = Buffer.from(expected, 'utf8');

	if (given.length !== want.length) return false;
	return timingSafeEqual(given, want);
};
