// @ts-check
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";

import react from "@astrojs/react";

import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

import vercel from "@astrojs/vercel";

/** 站点根地址：canonical、og:url、RSS、sitemap 都基于它，换成真实域名即可 */
const SITE = "https://wuyox.vercel.app";

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // 预取站内链接，让页面切换更顺滑
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  markdown: {
    shikiConfig: {
      // 代码块跟随站点深浅色：只输出 --shiki-light / --shiki-dark 变量，
      // 具体颜色交给 global.css 按 data-theme 决定，避免受系统深浅色影响
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
      defaultColor: false,
    },
  },
  // Enable many frameworks to support all different kinds of components.
  // No `include` is needed if you are only using a single JSX framework!
  integrations: [
    vue(),
    // 两个 JSX 集成必须互相 exclude：tsconfig 的 jsxImportSource 是 solid-js，
    // 不划清边界时 React 组件会被 Solid 的 babel 插件接管，报 Missing export "jsx"
    react({
      include: ["**/react/*"],
      exclude: ["**/solid/**"],
    }),
    solidJs({
      include: ["**/solid/*"],
      exclude: ["**/react/**"],
    }),
    sitemap({
      // 草稿不会生成页面，这里只是保险起见；写作台不进 sitemap
      filter: (page) => !page.includes("/draft/") && !page.includes("/admin"),
    }),
  ],
  // 整站仍是静态预渲染，只有 /admin 用到的两个接口按需执行（prerender = false）
  adapter: vercel(),
});
