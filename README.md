# Your Blog

一个基于 Astro 的中文个人博客，内容包含技术笔记、生活记录与思考。极简单列排版：纯文字、不用封面图、不用标签。

## 技术栈

- **Astro 7**（静态输出）+ Content Collections 管理文章
- **Vercel** 部署，`@astrojs/vercel` 适配器只为写作台的两个接口提供按需执行能力
- **React** 仅用于写作台编辑器（`src/components/react`），页面本身不跑框架运行时
- 没有数据库、没有自建后端：文章就是仓库里的 Markdown 文件

## 特性

- 文章按「技术 / 生活 / 思考」三类组织，导航直达分类页
- 首页为纯文字列表卡片：标题 + 日期 + 摘要，无封面图、无缩略图、无标签
- 文章页 740px 单列，带阅读时长、上一篇 / 下一篇
- 系列文章自动串成上下篇导航，标出「第几篇」
- 目录：窄屏内联折叠，宽屏固定在右侧，按滚动位置高亮当前章节
- 代码块为 macOS 窗口式深色卡片，带语言标签与常驻 Copy 按钮
- 正文图片点击放大（原生 `dialog`，零依赖）、滚过一屏出现回到顶部
- 浅色 / 深色主题切换，站内链接视口内预取
- RSS 与 sitemap 自动生成
- 手机写作台 `/admin`：手机上写完发布，Vercel 自动构建上线

## 快速开始

需要 Node 24（见 `package.json` 的 `engines`）。

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # 构建前会自动校验字体字符覆盖
pnpm preview
```

其他脚本：

```bash
pnpm fonts      # 重建霞鹜文楷子集（需 python + fonttools + brotli）
pnpm check:font # 只检查当前字体是否覆盖全站用字
```

## 目录结构

```text
.
├── public/
│   ├── fonts/                   # 霞鹜文楷子集，构建时生成并随仓库提交
│   ├── admin.webmanifest        # 写作台的 PWA 清单（可添加到主屏）
│   ├── admin-icon.svg
│   └── favicon.ico / favicon.svg
├── scripts/
│   ├── subset-font.mjs          # 按全站用字切出单个 woff2
│   ├── check-font.mjs           # 构建前校验字符覆盖，缺字自动重建
│   └── font-charset.mjs         # 收集站点字符
├── src/
│   ├── components/
│   │   ├── PostCard.astro
│   │   ├── Toc.astro
│   │   └── react/Editor.tsx     # 写作台编辑器（client:only）
│   ├── content/blog/            # 文章源文件
│   ├── layouts/Layout.astro     # head、导航、主题切换、代码块/目录/灯箱脚本
│   ├── lib/
│   │   ├── blog.ts              # 分类、slug、摘要截取（前后端共用）
│   │   ├── frontmatter.ts       # frontmatter 拼装、北京时间
│   │   └── server.ts            # 环境变量读取、密码校验
│   ├── pages/
│   │   ├── index.astro
│   │   ├── admin.astro          # 写作台
│   │   ├── 404.astro
│   │   ├── api/verify.ts        # 密码校验
│   │   ├── api/publish.ts       # 提交 Markdown 到仓库
│   │   ├── category/[slug].astro
│   │   ├── posts/[id].astro
│   │   └── rss.xml.ts
│   ├── styles/global.css
│   ├── utils/post.ts            # 分类映射、日期格式、阅读时长、排序
│   └── content.config.ts        # 文章 schema
├── astro.config.mjs
├── vercel.json                  # 字体与构建产物的长缓存头
├── .env.example                 # 写作台环境变量模板
└── package.json
```

## 文章格式

文章放在 `src/content/blog/`，文件名即 URL 里的 id（`posts/20260421-post1`），frontmatter 由 `content.config.ts` 校验：

```yaml
---
title: "文章标题"
description: "首页使用的摘要"
category: "技术" # 技术 / 生活 / 思考，必填
author: "Your Name"
series: "所属系列（可选）"
date: 2026-04-21T10:00:00+08:00
updatedAt: 2026-04-21T18:00:00+08:00
draft: false
---
```

- `category` 必填且只能是三个值之一，写错会直接构建失败
- `draft: true` 的文章不生成页面，也不会出现在列表、RSS、sitemap 里
- `description` 必填非空（首页与 meta description 都用它）

## 手机写作台（/admin）

手机浏览器打开 `https://your-blog.vercel.app/admin`，添加到主屏幕就是一个独立 App：写 Markdown、切预览、选分类，草稿自动存本机；点「发布」后接口把 `.md` 提交到仓库，Vercel 收到 push 自动构建，一两分钟内文章上线。

实现上不跑任何数据库：`/admin` 是静态页面 + React 客户端组件，`/api/verify`、`/api/publish` 两个接口凭 `GITHUB_TOKEN` 调 GitHub Contents API 提交文件。整站其余页面仍是纯静态预渲染。

### 一次性配置

1. 建 GitHub 细粒度 PAT（Settings → Developer settings → Personal access tokens → Fine-grained tokens），**只授权本博客仓库**，仓库权限勾 `Contents: Read and write`
2. Vercel 项目 → Settings → Environment Variables 填入下表变量
3. 重新部署一次，让环境变量生效

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 写作台登录密码 |
| `GITHUB_TOKEN` | 是 | 上面的细粒度 PAT |
| `GITHUB_OWNER` | 是 | 仓库归属账号（如 `your-github-name`） |
| `GITHUB_REPO` | 是 | 仓库名（如 `your-blog`） |
| `GITHUB_BRANCH` | 否 | 默认 `main` |
| `GITHUB_BLOG_DIR` | 否 | 文章目录，默认 `src/content/blog` |
| `SITE_URL` | 否 | 发布成功后回显的站点地址，默认 `https://your-blog.vercel.app` |
| `BLOG_AUTHOR` | 否 | frontmatter 里的作者，默认 `Your Name` |

本地开发把 `.env.example` 复制成 `.env` 填好，`pnpm dev` 后访问 `http://localhost:4321/admin`。注意改了 `.env` 要重启 dev server 才生效。

### 行为约定

- 密码存在浏览器 `localStorage`，换设备需重新输入；「退出并清空本机草稿」会一起清掉
- 提交路径为 `src/content/blog/{YYYYMMDD}-{slug}.md`，日期按**北京时间**生成（避免 Vercel 的 UTC 把日期写早一天）
- slug 取标题里的 ASCII 字母数字；纯中文标题兜底成 `post-HHmm`，同一天发多篇也不会撞名
- 同一天同 slug 重复发布会被拒绝（409），改标题或手动填「文件名后缀」即可
- 勾「存为草稿」提交后是 `draft: true`，不生成页面；改回 `false` 才上线
- 摘要留空时自动从正文截取前 80 字，与首页展示规则一致
- 写作台带 `noindex`，也不进 sitemap 和 RSS
- 暂未注册 Service Worker：断网时只能依赖本机草稿，联网后再发布

## 设计说明

- 排版参数：米白背景 `#f5f4ed`、白卡 8px 圆角、列表 900px / 正文 740px、首页 15px/1.64、文章页 17px/1.64、标题 30px/1.35
- 正文字体用**霞鹜文楷**（LXGW WenKai，SIL OFL 开源），自托管：`scripts/subset-font.mjs` 把全站用到的字打成单个 woff2，`@font-face` 内联在 `<head>` 并配 `font-display: optional`，避免「先画一遍再换字」的闪烁；文件名带内容指纹，配 immutable 长缓存
- 代码块固定深色卡片（浅色页面里也是深色），配色统一取 Shiki 的 dark 主题，这样代码 token 不会出现深底浅字看不清的问题
- 不使用封面图、标签、分页；内容靠分类与时间组织
- 颜色、圆角、容器宽度集中在 `src/styles/global.css` 的 CSS 变量里

## 部署

推送到 `main` 即触发 Vercel 构建，无需额外 CI 配置。产物走 Build Output API（`.vercel/output`）：页面全部预渲染成静态文件，只有 `/api/*` 两个路由打到同一个函数。`vercel.json` 只负责字体与 `_astro` 产物的长缓存头。

## 字体子集

字库是按「站点用到的字」切的，新文章出现字库里没有的汉字时，那些字会退回系统楷体，字形和字重会不一致。

- 本地构建：`pnpm build` 前会比对字符集，缺字自动重建（需要 python 与 `fonttools`、`brotli`）
- Vercel 构建：`.cache` 不在仓库里，检测不到字符集缓存时会跳过校验，直接用仓库里已提交的字体

所以手机上发了含生僻字的新文章后，偶尔在本地跑一次 `pnpm fonts` 再提交，字才会补齐。

## 后续可扩展项

当前刻意不做的：封面图、标签、分页（见「设计说明」）。下面这些是可以补的，每条标了现在的状态：

- **首页分页**：现在一次性渲染全部文章，篇数多了首屏会变重
- **站内搜索**：要先产出搜索索引；`/` 快捷键只在桌面可用，手机端还得另给入口
- **写作台编辑已发布文章**：现在只支持新建，撞名会被 409 拒绝，改稿还得回 GitHub 网页
- **写作台删文 / 归档**：同理，目前只能手改仓库
- **文章内配图上传**：走对象存储，别把二进制塞进 git（列表页仍不使用封面图）
