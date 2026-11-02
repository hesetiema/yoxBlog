/**
 * build 前检查字体子集是否覆盖了整站字符。
 *
 * 背景：字库是构建期按「站点用到的字」切好的（scripts/subset-font.mjs）。
 * 新文章写了字库里没有的汉字时，浏览器只能退回系统楷体，同一段里字形/字重会不一致，
 * 而这种问题只在特定文章才看得见，很容易漏。这里在构建前自动比对，
 * 发现缺字就重跑一次子集；重跑失败（没装 python/fonttools）只报警、不阻断构建。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectChars, root } from './font-charset.mjs';

const charsetFile = join(root, '.cache', 'fonts', 'charset.txt');
const outFile = join(root, 'public', 'fonts', 'lxgw-wenkai-400.woff2');

const next = new Set(collectChars());

/** 把缺失字符拼成一行样例，太长就截断 */
const preview = (chars) => {
	const list = chars.slice(0, 24).join('');
	return chars.length > 24 ? `${list}…` : list;
};

let reason = '';
if (!existsSync(outFile)) {
	reason = '字体文件不存在';
} else if (!existsSync(charsetFile)) {
	// CI（Vercel 等）只拉仓库，.cache 不在版本库里，也没有 python 环境：
	// 字体已经跟着仓库走了，这里没有缓存就跳过校验，别让构建日志刷一堆失败警告
	console.log('字体子集已随仓库提交，缺少字符集缓存，跳过覆盖率校验');
	process.exit(0);
} else {
	const prev = new Set(readFileSync(charsetFile, 'utf8'));
	const added = [...next].filter((ch) => !prev.has(ch));
	if (added.length > 0) reason = `新增 ${added.length} 个字符：${preview(added)}`;
}

if (!reason) {
	console.log(`字体子集已覆盖全部字符（共 ${next.size} 个）`);
	process.exit(0);
}

console.log(`字体子集需要更新：${reason}`);
try {
	execFileSync(process.execPath, [join(root, 'scripts', 'subset-font.mjs')], { stdio: 'inherit' });
} catch {
	console.warn('');
	console.warn('⚠ 字体子集重建失败，构建继续，但新增的字会退回系统楷体。');
	console.warn('  重建需要 python 与 fonttools：python -m pip install fonttools brotli');
	console.warn('  装好后单独跑一次 pnpm fonts 即可。');
	console.warn('');
}
