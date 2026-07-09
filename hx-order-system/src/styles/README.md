# src/styles 全局样式目录

本目录用于存放**跨模块共享的全局样式**（与组件级 `*.module.css` 区分）。

## 使用规范

| 目录/文件 | 用途 | 命名 |
|-----------|------|------|
| `src/styles/*.css` | 跨组件共享的全局样式（带 hash 后缀，无 scoped） | `kebab-case.css` |
| `src/**/Xxx.module.css` | 组件级局部样式（CSS Modules，自动 scoped） | `PascalCase.module.css` |
| `src/index.css` | Tailwind 入口 + 全局 reset | - |

## 当前内容

- `README.md`（本文件）

## 待补充内容（按需）

- `scrollbar.css`：统一浏览器滚动条样式
- `theme-overrides.css`：antd 主题 token 微调

新增全局样式前请确认该样式**确实需要全局生效**，否则优先使用 `*.module.css`。