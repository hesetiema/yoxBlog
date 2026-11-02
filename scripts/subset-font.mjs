/**
 * 生成站点专用的霞鹜文楷子集字体（单字重 400）。
 *
 * 为什么不用 CDN 的 lxgwwenkai-regular.css：
 * 它把字库切成 97 个 unicode-range 分片、全部 font-display: swap。
 * 换文章时新分片要现下载，先用回退楷体渲染、到货再换字，页面文字就会"跳"。
 * 这里把整站用到的字符收成一个 woff2，切换页面时命中同一份缓存，不再换字。
 *
 * 用法：npm run fonts
 * 依赖：python + fonttools（python -m pip install fonttools brotli）
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { collectChars, root } from './font-charset.mjs';

const cacheDir = join(root, '.cache', 'fonts');
const sourceFont = join(cacheDir, 'LXGWWenKai-Regular.ttf');
const outDir = join(root, 'public', 'fonts');
const outFile = join(outDir, 'lxgw-wenkai-400.woff2');
const charsetFile = join(cacheDir, 'charset.txt');

/**
 * 源字体只从官方 release 取（https://github.com/lxgw/LxgwWenKai/releases），
 * 仓库里的 TTF 不是发布构建，不要用 cdn.jsdelivr.net/gh 之类的镜像。
 * 升级：改 FONT_VERSION，删掉 .cache/fonts 下的旧文件再跑一次。
 */
const FONT_VERSION = process.env.FONT_VERSION ?? 'v1.530';
const sourceUrl = `https://github.com/lxgw/LxgwWenKai/releases/download/${FONT_VERSION}/LXGWWenKai-Regular.ttf`;

async function ensureSourceFont() {
	if (existsSync(sourceFont)) return;
	mkdirSync(cacheDir, { recursive: true });
	console.log(`下载源字体 ${sourceUrl}`);
	const res = await fetch(sourceUrl);
	if (!res.ok) throw new Error(`下载失败：${res.status} ${res.statusText}`);
	writeFileSync(sourceFont, Buffer.from(await res.arrayBuffer()));
	console.log(`已保存 ${(statSync(sourceFont).size / 1024 / 1024).toFixed(1)} MB`);
}

await ensureSourceFont();

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(charsetFile), { recursive: true });

const charset = collectChars();
mkdirSync(dirname(charsetFile), { recursive: true });
writeFileSync(charsetFile, charset, 'utf8');
console.log(`收集字符 ${[...charset].length} 个 → ${charsetFile}`);

execFileSync(
	'python',
	[
		'-m',
		'fontTools.subset',
		sourceFont,
		`--text-file=${charsetFile}`,
		`--output-file=${outFile}`,
		'--flavor=woff2',
		'--layout-features=kern,liga,clig,calt',
		'--no-hinting',
		'--desubroutinize',
		'--drop-tables+=DSIG',
		'--name-IDs=1,2,4,6',
		'--recalc-bounds',
	],
	{ stdio: 'inherit' }
);

console.log(`生成 ${outFile}（${(statSync(outFile).size / 1024).toFixed(0)} KB）`);

// 源字体里没有的字符会被浏览器退回系统字体，把清单打出来，避免出现"同段混排"却没人发现
const missing = execFileSync(
	'python',
	[
		'-c',
		[
			'import sys',
			'from fontTools.ttLib import TTFont',
			'cmap = set()',
			'for t in TTFont(sys.argv[1])["cmap"].tables: cmap.update(t.cmap)',
			'text = open(sys.argv[2], encoding="utf-8").read()',
			'missing = sorted({c for c in text if ord(c) not in cmap})',
			'print("".join(missing))',
		].join('\n'),
		sourceFont,
		charsetFile,
	],
	{ encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
).trim();

if (missing) {
	console.warn(`⚠ 源字体缺少 ${[...missing].length} 个字符，这些字符会退回系统字体：${missing}`);
} else {
	console.log('字符覆盖完整');
}
