import type { APIRoute } from 'astro';
import { isAuthorized, json, readEnv } from '../../lib/server';

// 需要按需执行：静态整站里这个路由会部署成 Vercel Function
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	if (!readEnv('ADMIN_PASSWORD')) {
		return json({ message: '服务器还没配置 ADMIN_PASSWORD，写作台暂时不可用' }, 500);
	}

	if (!isAuthorized(request)) {
		return json({ message: '密码不对' }, 401);
	}

	return json({ ok: true });
};
