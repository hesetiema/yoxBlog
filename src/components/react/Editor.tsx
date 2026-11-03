/** @jsxImportSource react */
import { marked } from 'marked';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, deriveDescription, slugify, type Category } from '../../lib/blog';

const DRAFT_KEY = 'yoxwu:admin:draft';
const KEY_STORE = 'yoxwu:admin:key';

interface Draft {
	title: string;
	description: string;
	category: Category;
	series: string;
	body: string;
	slug: string;
	asDraft: boolean;
}

const emptyDraft = (): Draft => ({
	title: '',
	description: '',
	category: '技术',
	series: '',
	body: '',
	slug: '',
	asDraft: false,
});

interface PublishResult {
	url: string | null;
	commitUrl: string;
	id: string;
	draft: boolean;
}

const readDraft = (): { draft: Draft; savedAt: number | null } => {
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return { draft: emptyDraft(), savedAt: null };

		const parsed = JSON.parse(raw) as Partial<Draft> & { savedAt?: number };
		return { draft: { ...emptyDraft(), ...parsed }, savedAt: parsed.savedAt ?? null };
	} catch {
		return { draft: emptyDraft(), savedAt: null };
	}
};

const countChars = (text: string): number => text.replace(/\s/g, '').length;

/** 本机时间的 HHmm，只用来预览兜底文件名 */
const localTimeKey = (): string => {
	const now = new Date();
	return `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
};

const formatClock = (time: number): string =>
	new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export default function Editor() {
	const [key, setKey] = useState<string | null>(null);
	const [unlocked, setUnlocked] = useState(false);
	const [checking, setChecking] = useState(true);
	const [draft, setDraft] = useState<Draft>(emptyDraft);
	const [savedAt, setSavedAt] = useState<number | null>(null);
	const [descTouched, setDescTouched] = useState(false);
	const [view, setView] = useState<'write' | 'preview'>('write');
	const [error, setError] = useState<string | null>(null);
	const [publishing, setPublishing] = useState(false);
	const [result, setResult] = useState<PublishResult | null>(null);
	const [password, setPassword] = useState('');

	const bodyRef = useRef<HTMLTextAreaElement | null>(null);

	const patch = useCallback((next: Partial<Draft>) => {
		setDraft((current) => ({ ...current, ...next }));
	}, []);

	/* 打开页面：先看本机有没有存过密码，存过就直接验一次 */
	useEffect(() => {
		const restored = readDraft();
		setDraft(restored.draft);
		setSavedAt(restored.savedAt);

		const stored = localStorage.getItem(KEY_STORE);
		if (!stored) {
			setChecking(false);
			return;
		}

		fetch('/api/verify', { method: 'POST', headers: { 'x-admin-key': stored } })
			.then((response) => {
				if (!response.ok) {
					localStorage.removeItem(KEY_STORE);
					return;
				}
				setKey(stored);
				setUnlocked(true);
			})
			.catch(() => undefined)
			.finally(() => setChecking(false));
	}, []);

	/* 草稿落本机：500ms 防抖，手机切走或断网也不会丢 */
	useEffect(() => {
		if (!unlocked) return;

		const timer = setTimeout(() => {
			const stamp = Date.now();
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: stamp }));
			} catch {
				/* 隐私模式下写不进去就算了 */
			}
			setSavedAt(stamp);
		}, 500);

		return () => clearTimeout(timer);
	}, [draft, unlocked]);

	/* 正文框跟着内容长高，避免手机上出现两层滚动条 */
	useEffect(() => {
		const node = bodyRef.current;
		if (!node || view !== 'write') return;
		node.style.height = 'auto';
		node.style.height = `${Math.max(node.scrollHeight, 240)}px`;
	}, [draft.body, view]);

	const autoDescription = useMemo(() => deriveDescription(draft.body), [draft.body]);
	const descriptionValue = descTouched ? draft.description : autoDescription;
	const slugPreview = slugify(draft.slug.trim() || draft.title) || `post-${localTimeKey()}`;
	const html = useMemo(() => {
		if (view !== 'preview') return '';
		return marked.parse(draft.body || '_还没有内容_', { async: false, gfm: true }) as string;
	}, [draft.body, view]);

	const unlock = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);

		const candidate = password.trim();
		if (!candidate) return;

		try {
			const response = await fetch('/api/verify', {
				method: 'POST',
				headers: { 'x-admin-key': candidate },
			});
			const data = (await response.json().catch(() => ({}))) as { message?: string };

			if (!response.ok) {
				setError(data.message ?? '进不去，稍后再试');
				return;
			}

			localStorage.setItem(KEY_STORE, candidate);
			setKey(candidate);
			setUnlocked(true);
			setPassword('');
		} catch {
			setError('网络不通，检查一下连接');
		}
	};

	const logout = () => {
		localStorage.removeItem(KEY_STORE);
		localStorage.removeItem(DRAFT_KEY);
		setKey(null);
		setUnlocked(false);
		setDraft(emptyDraft());
		setSavedAt(null);
		setDescTouched(false);
		setResult(null);
	};

	const publish = async () => {
		if (!key || publishing) return;
		setError(null);

		if (!draft.title.trim()) {
			setError('先写个标题');
			return;
		}
		if (!draft.body.trim()) {
			setError('正文还是空的');
			return;
		}

		setPublishing(true);
		try {
			const response = await fetch('/api/publish', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-admin-key': key },
				body: JSON.stringify({
					title: draft.title,
					description: descriptionValue,
					category: draft.category,
					series: draft.series,
					slug: draft.slug,
					body: draft.body,
					draft: draft.asDraft,
				}),
			});
			const data = (await response.json().catch(() => ({}))) as {
				message?: string;
				url?: string | null;
				commitUrl?: string;
				id?: string;
				draft?: boolean;
			};

			if (response.status === 401) {
				localStorage.removeItem(KEY_STORE);
				setKey(null);
				setUnlocked(false);
				setError('密码失效了，重新登录一次');
				return;
			}

			if (!response.ok) {
				setError(data.message ?? `发布失败（${response.status}）`);
				return;
			}

			setResult({
				url: data.url ?? null,
				commitUrl: data.commitUrl ?? '',
				id: data.id ?? '',
				draft: data.draft === true,
			});
			localStorage.removeItem(DRAFT_KEY);
			setDraft(emptyDraft());
			setSavedAt(null);
			setDescTouched(false);
			setView('write');
		} catch {
			setError('提交时网络断了，内容还在本地，重试一下');
		} finally {
			setPublishing(false);
		}
	};

	/* 有内容没发布就关页面时拦一下 */
	useEffect(() => {
		const dirty = Boolean(draft.title.trim() || draft.body.trim());
		if (!unlocked || !dirty) return;

		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [draft.body, draft.title, unlocked]);

	if (checking) {
		return <p className="admin-hint">正在打开写作台…</p>;
	}

	if (!unlocked) {
		return (
			<section className="admin-lock">
				<h1 className="admin-lock-title">写作台</h1>
				<p className="admin-hint">输入密码开始写，发布后由 GitHub 自动部署。</p>

				<form className="admin-lock-form" onSubmit={unlock}>
					<input
						className="admin-input"
						type="password"
						inputMode="text"
						autoComplete="current-password"
						placeholder="密码"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
					<button className="admin-btn admin-btn-primary" type="submit">
						进入
					</button>
				</form>

				{error && <p className="admin-error">{error}</p>}
			</section>
		);
	}

	if (result) {
		return (
			<section className="admin-result">
				<p className="admin-result-badge">{result.draft ? '已存为草稿' : '发布成功'}</p>
				<h1 className="admin-result-title">{result.id}</h1>
				<p className="admin-hint">
					{result.draft
						? '草稿已提交到仓库，把 draft 改成 false 才会生成页面。'
						: 'Vercel 正在构建，一般一两分钟内就能打开。'}
				</p>

				<div className="admin-result-links">
					{result.url && (
						<a className="admin-btn admin-btn-primary" href={result.url} target="_blank" rel="noreferrer">
							打开文章
						</a>
					)}
					{result.commitUrl && (
						<a className="admin-btn" href={result.commitUrl} target="_blank" rel="noreferrer">
							查看提交
						</a>
					)}
				</div>

				<button
					className="admin-btn admin-btn-ghost"
					type="button"
					onClick={() => {
						setResult(null);
						setView('write');
					}}
				>
					再写一篇
				</button>
			</section>
		);
	}

	return (
		<>
			<header className="admin-bar">
				<div className="admin-bar-info">
					<span className="admin-brand">写作台</span>
					<span className="admin-count">{countChars(draft.body)} 字</span>
				</div>

				<div className="admin-bar-actions">
					<button
						className="admin-btn admin-btn-ghost"
						type="button"
						onClick={() => setView(view === 'write' ? 'preview' : 'write')}
					>
						{view === 'write' ? '预览' : '继续写'}
					</button>
					<button
						className="admin-btn admin-btn-primary"
						type="button"
						disabled={publishing}
						onClick={publish}
					>
						{publishing ? '提交中…' : draft.asDraft ? '存草稿' : '发布'}
					</button>
				</div>
			</header>

			{error && (
				<div className="admin-toast" role="alert">
					<span>{error}</span>
					<button type="button" aria-label="关闭提示" onClick={() => setError(null)}>
						×
					</button>
				</div>
			)}

			<main className="admin-main">
				{view === 'write' ? (
					<>
						<input
							className="admin-title"
							type="text"
							placeholder="标题"
							enterKeyHint="next"
							value={draft.title}
							onChange={(event) => patch({ title: event.target.value })}
						/>

						<div className="admin-chips" role="group" aria-label="选择分类">
							{CATEGORIES.map((item) => (
								<button
									key={item}
									type="button"
									className="admin-chip"
									aria-pressed={draft.category === item}
									onClick={() => patch({ category: item })}
								>
									{item}
								</button>
							))}
						</div>

						<details className="admin-advanced">
							<summary>更多设置</summary>

							<label className="admin-field">
								<span>摘要</span>
								<textarea
									rows={2}
									placeholder="留空就自动从正文里截一段"
									value={descriptionValue}
									onChange={(event) => {
										setDescTouched(event.target.value.trim().length > 0);
										patch({ description: event.target.value });
									}}
								/>
							</label>

							<label className="admin-field">
								<span>系列（可选）</span>
								<input
									type="text"
									placeholder="比如：Understanding ECMAScript 6 翻译笔记"
									value={draft.series}
									onChange={(event) => patch({ series: event.target.value })}
								/>
							</label>

							<label className="admin-field">
								<span>文件名后缀</span>
								<input
									type="text"
									placeholder="留空按标题自动生成"
									value={draft.slug}
									onChange={(event) => patch({ slug: event.target.value })}
								/>
								<small className="admin-note">
									提交为 {slugPreview}.md；中文标题会自动带上时分，同一天多篇也不撞名
								</small>
							</label>

							<label className="admin-switch">
								<input
									type="checkbox"
									checked={draft.asDraft}
									onChange={(event) => patch({ asDraft: event.target.checked })}
								/>
								<span>存为草稿（不生成页面）</span>
							</label>
						</details>

						<textarea
							ref={bodyRef}
							className="admin-body"
							placeholder="开始写…支持 Markdown"
							value={draft.body}
							onChange={(event) => patch({ body: event.target.value })}
						/>
					</>
				) : (
					<article className="admin-prose" dangerouslySetInnerHTML={{ __html: html }} />
				)}
			</main>

			<footer className="admin-foot">
				<span>{savedAt ? `草稿已存本机 · ${formatClock(savedAt)}` : '内容只存在这台设备上'}</span>
				<button className="admin-link" type="button" onClick={logout}>
					退出并清空本机草稿
				</button>
			</footer>
		</>
	);
}
