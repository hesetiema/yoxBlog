import type { APIRoute } from 'astro';
import { deriveDescription, isCategory, slugify } from '../../lib/blog';
import { beijingNow, buildMarkdownFile } from '../../lib/frontmatter';
import { isAuthorized, json, readEnv } from '../../lib/server';

export const prerender = false;

const GITHUB_API = 'https://api.github.com';

/** 作者名默认值，可在 Vercel 环境变量里覆盖 */
const DEFAULT_AUTHOR = 'Yoxwu';
const DEFAULT_BRANCH = 'main';
const DEFAULT_DIR = 'src/content/blog';

const githubHeaders = (token: string): Record<string, string> => ({
	accept: 'application/vnd.github+json',
	authorization: `Bearer ${token}`,
	'x-github-api-version': '2022-11-28',
	'user-agent': 'yoxwu-blog-admin',
	'content-type': 'application/json',
});

/** 路径必须按段编码：整段 encodeURIComponent 会把 / 也编掉，GitHub 就找不到文件了 */
const encodePath = (path: string): string => path.split('/').map(encodeURIComponent).join('/');

const readFileSha = async (options: {
	token: string;
	owner: string;
	repo: string;
	branch: string;
	path: string;
}): Promise<string | null> => {
	const { token, owner, repo, branch, path } = options;
	const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`;
	const response = await fetch(url, { headers: githubHeaders(token) });

	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`读取远端文件失败（GitHub ${response.status}）`);
	}

	const data = (await response.json()) as { sha?: string };
	return data.sha ?? null;
};

/** 只取前端关心的字段，其余一律忽略，避免把任意结构写进 frontmatter */
interface PublishPayload {
	title?: unknown;
	description?: unknown;
	category?: unknown;
	series?: unknown;
	body?: unknown;
	slug?: unknown;
	draft?: unknown;
	overwrite?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
	if (!readEnv('ADMIN_PASSWORD')) {
		return json({ message: '服务器还没配置 ADMIN_PASSWORD，写作台暂时不可用' }, 500);
	}

	if (!isAuthorized(request)) {
		return json({ message: '密码不对' }, 401);
	}

	let payload: PublishPayload;
	try {
		payload = (await request.json()) as PublishPayload;
	} catch {
		return json({ message: '请求内容不是合法 JSON' }, 400);
	}

	const title = String(payload.title ?? '').trim();
	const body = String(payload.body ?? '').trim();
	const category = payload.category;

	if (!title) return json({ message: '标题不能为空' }, 400);
	if (title.length > 120) return json({ message: '标题别超过 120 个字' }, 400);
	if (!body) return json({ message: '正文不能为空' }, 400);
	if (!isCategory(category)) {
		return json({ message: '分类只能是「技术 / 生活 / 思考」' }, 400);
	}

	// 摘要留空时从正文里摘一段，和首页展示的规则保持一致
	const description = String(payload.description ?? '').trim() || deriveDescription(body);
	if (!description) {
		return json({ message: '摘要不能为空，正文里也没能自动截出内容' }, 400);
	}

	const series = String(payload.series ?? '').trim();
	const draft = payload.draft === true;

	const { iso, dateKey, timeKey } = beijingNow();

	/*
		中文标题生成不出 ASCII slug 时用 post-HHmm 兜底：
		只写 post 的话，同一天发第二篇中文标题的文章就会撞名报 409。
		手动填了「文件名后缀」的仍以填写的为准。
	*/
	const slug = slugify(String(payload.slug ?? '').trim() || title) || `post-${timeKey}`;
	const id = `${dateKey}-${slug}`;

	const dir = readEnv('GITHUB_BLOG_DIR') || DEFAULT_DIR;
	const path = `${dir}/${id}.md`;

	const file = buildMarkdownFile(
		{
			title,
			description,
			category,
			author: readEnv('BLOG_AUTHOR') || DEFAULT_AUTHOR,
			series: series || undefined,
			date: iso,
			draft,
		},
		body,
	);

	const token = readEnv('GITHUB_TOKEN');
	const owner = readEnv('GITHUB_OWNER');
	const repo = readEnv('GITHUB_REPO');
	const branch = readEnv('GITHUB_BRANCH') || DEFAULT_BRANCH;

	if (!token || !owner || !repo) {
		return json(
			{ message: '服务器缺少 GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO，先在 Vercel 环境变量里补上' },
			500,
		);
	}

	try {
		const sha = await readFileSha({ token, owner, repo, branch, path });

		if (sha && payload.overwrite !== true) {
			return json({ message: `已存在同名文章 ${id}，改个标题或手动指定 slug 再发`, conflict: id }, 409);
		}

		const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodePath(path)}`;
		const response = await fetch(url, {
			method: 'PUT',
			headers: githubHeaders(token),
			body: JSON.stringify({
				message: `post: ${title}${draft ? ' (draft)' : ''}`,
				content: Buffer.from(file, 'utf8').toString('base64'),
				branch,
				...(sha ? { sha } : {}),
			}),
		});

		if (!response.ok) {
			const detail = await response.text().catch(() => '');
			const hint =
				response.status === 401 || response.status === 403
					? '检查 GITHUB_TOKEN 是否过期、是否给了这个仓库的 Contents 读写权限'
					: response.status === 404
						? '检查 GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH 是否写错'
						: 'GitHub 拒绝了这次提交';

			return json({ message: `${hint}（${response.status}）${detail.slice(0, 200)}` }, 502);
		}

		const result = (await response.json()) as { commit?: { html_url?: string; sha?: string } };
		const site = (readEnv('SITE_URL') || 'https://wuyox.vercel.app').replace(/\/$/, '');

		return json({
			ok: true,
			id,
			path,
			draft,
			// 草稿不会生成页面，所以不给预览地址
			url: draft ? null : `${site}/posts/${id}`,
			commitUrl: result.commit?.html_url ?? `${site}`,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : '提交失败';
		return json({ message }, 502);
	}
};
