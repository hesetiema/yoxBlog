/**
 * 收集站点用到的字符。
 *
 * subset-font.mjs（重新生成字体子集）和 check-font.mjs（build 前检查覆盖率）共用同一份逻辑，
 * 两边算法一旦不一致，检查就会漏报或误报。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

export const root = resolve(import.meta.dirname, '..');

/** 扫描这些目录/后缀的文本，用于收集字符 */
const scanDirs = ['src'];
const scanExts = new Set(['.astro', '.md', '.mdx', '.css', '.ts', '.tsx', '.js', '.jsx', '.json']);

/** 无论正文有没有出现都要带上的字符：ASCII、中英文标点、常用符号 */
const baseline =
	' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
	'，。、；：？！“”‘’（）《》〈〉【】〔〕［］｛｝—…·～｜／＼＋－＝＜＞％＃＄＆＊＠' +
	'°±×÷≈≠≤≥∞√←→↑↓•◆◇●○■□★☆✓';

function walk(dir, acc = []) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			walk(full, acc);
		} else if (scanExts.has(extname(name))) {
			acc.push(full);
		}
	}
	return acc;
}

/** 返回排好序、去重后的字符串（每个字符只出现一次） */
export function collectChars() {
	const chars = new Set(baseline);
	for (const dir of scanDirs) {
		const abs = join(root, dir);
		if (!existsSync(abs)) continue;
		for (const file of walk(abs)) {
			for (const ch of readFileSync(file, 'utf8')) {
				const code = ch.codePointAt(0);
				// 跳过控制字符与代理区
				if (code < 0x20 || (code >= 0x7f && code < 0xa0)) continue;
				chars.add(ch);
			}
		}
	}
	return [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
}
