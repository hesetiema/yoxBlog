# Yoxwu Blog

一个基于 Astro 的中文个人博客，内容包含技术笔记、日常记录与感悟。版式参考极简博客（如 tw93.fun）：单列、纯文字、不用配图、不用标签。

## 特性

- 使用 Astro Content Collections 管理文章，文章位于 `src/content/blog`
- 文章按「技术 / 日常 / 感悟」三类组织，导航直达分类页
- 首页为纯文字列表卡片：标题 + 【日期】 + 摘要，无封面图、无缩略图、无标签
- 文章页单列排版，740px 正文宽度，带阅读时长与上一篇/下一篇
- 支持浅色 / 深色主题切换，站内链接预取

## 目录结构

```text
.
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── PostCard.astro
│   ├── content/
│   │   └── blog/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── category/
│   │   └── posts/
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── post.ts
│   └── content.config.ts
├── astro.config.mjs
└── package.json
```

## 设计说明

- 排版参数对齐 tw93.fun：米白背景 `#f5f4ed`、白卡 8px 圆角、900px 列表 / 740px 正文、正文 15px/1.64、文章页 17px/1.64、标题 30px/1.35
- 正文字体用**霞鹜文楷**（LXGW WenKai，SIL OFL 开源），通过 jsDelivr 按 unicode-range 分片加载，只下载页面用到的字；回退链与参考站点一致（`STKaiti / KaiTi` 等系统楷体）
- 代码块固定使用系统等宽字体 14px，Shiki 双主题（`github-light-high-contrast` / `github-dark-high-contrast`），颜色由 `data-theme` 决定
- 不使用封面图、标签、分页；内容靠分类与时间组织
- 颜色、圆角、容器宽度集中在 `src/styles/global.css` 的 CSS 变量里

## 文章 Frontmatter

```yaml
---
title: "文章标题"
description: "首页使用的摘要"
category: "技术" # 技术 / 日常 / 感悟，默认技术
author: "Yoxwu"
series: "所属系列（可选）"
date: 2026-04-21T10:00:00+08:00
updatedAt: 2026-04-21T18:00:00+08:00
draft: false
---
```

## 开发命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## 后续可扩展项

- 文章超过 10 篇后加分页
- 增加 RSS 与键盘唤起（`/`）的站内搜索
- 为代码块增加复制按钮
