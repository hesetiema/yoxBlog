# Yoxwu Blog

一个基于 Astro 6 的中文技术博客，主要记录 JavaScript、ECMAScript 语言特性、规范理解和前端实现笔记。

## 特性

- 使用 Astro Content Collections 管理文章，文章位于 `src/content/blog`
- 首页提供摘要式文章列表，而不是只有标题入口
- 每篇文章支持 `description`、`author`、`series`、`date`、`updatedAt`、`cover`、`tags` 等元数据
- 提供标签归档页，可按主题浏览相关文章
- 自定义博客视觉布局，包含首页专题展示和文章正文排版

## 目录结构

```text
.
├── public/
│   ├── covers/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── content/
│   │   └── blog/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── posts/
│   │   └── tags/
│   └── content.config.ts
├── astro.config.mjs
└── package.json
```

## 文章 Frontmatter

博客文章使用以下字段：

```yaml
---
title: "文章标题"
description: "首页和标签页使用的文章摘要"
author: "作者名"
series: "所属系列"
date: 2026-04-21T10:00:00+08:00
updatedAt: 2026-04-21T18:00:00+08:00
cover: "/covers/example.svg"
tags:
	- JavaScript
	- ECMAScript 6
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

- 增加分页、搜索或 RSS
- 为文章补充目录和上一篇/下一篇导航
- 接入 remark/rehype 插件增强 Markdown 展示
