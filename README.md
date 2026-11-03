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
category: "技术" # 技术 / 生活 / 思考，必填
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

## 手机写作台（/admin）

手机浏览器打开 `https://wuyox.vercel.app/admin`，加到主屏幕就是一个独立 App：写 Markdown、预览、选分类，草稿自动存本机；点「发布」后接口把 `.md` 提交到仓库，Vercel 收到 push 自动构建，一两分钟内文章上线。

实现上不跑任何数据库：`/admin` 是静态页面 + React 客户端组件，`/api/verify`、`/api/publish` 两个 Astro 接口在 Vercel 上按需执行，凭 `GITHUB_TOKEN` 调 GitHub Contents API 提交文件。整站其余页面仍是纯静态预渲染。

### 一次性配置

1. 建 GitHub 细粒度 PAT（Settings → Developer settings → Personal access tokens → Fine-grained tokens），只授权本博客仓库，仓库权限勾 `Contents: Read and write`
2. Vercel 项目 → Settings → Environment Variables 添加 `ADMIN_PASSWORD`、`GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO`，其余可选项见 `.env.example`
3. 重新部署一次让环境变量生效

本地开发把 `.env.example` 复制成 `.env` 填好，`pnpm dev` 后访问 `http://localhost:4321/admin`。

### 行为约定

- 密码存在浏览器 `localStorage`，换设备要重新输入；「退出并清空本机草稿」会一起清掉
- 提交路径为 `src/content/blog/{YYYYMMDD}-{slug}.md`，日期按北京时间生成；标题是纯中文时 slug 兜底成 `post-HHmm`，同一天发多篇也不会撞名
- 当天同 slug 重复发布会被拒绝（409），改标题或手动填「文件名后缀」即可
- 勾选「存为草稿」提交后 `draft: true`，不生成页面；改回 `false` 才上线
- 摘要留空时自动从正文截取前 80 字，与首页展示规则一致
- 暂未注册 Service Worker：断网时只能依赖本机草稿，联网后再发布

## 后续可扩展项

- 文章超过 10 篇后加分页
- 增加 RSS 与键盘唤起（`/`）的站内搜索
- 为代码块增加复制按钮
- 写作台支持列出并编辑已发布文章
