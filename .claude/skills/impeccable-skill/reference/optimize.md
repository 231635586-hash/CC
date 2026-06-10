# Optimize：UI 性能优化

> "性能是一个功能。识别这个界面的实际瓶颈，修复它，然后测量。不要优化不是慢的东西。"

测量之前和之后。过早的优化浪费时间。

---

## 评估性能问题

首先测量：
- Core Web Vitals（LCP、FID/INP、CLS）
- 加载时间和可交互时间
- 包大小（JS、CSS、图片）
- 运行时性能（帧下降、长任务）
- 网络行为（请求数、有效载荷大小）

---

## 优化图片

- 使用现代格式：照片用 WebP，支持的地方用 AVIF，图标用 SVG
- 带宽度描述符和 `sizes` 属性的响应式 `srcset`
- 懒加载折叠以下的图片：`loading="lazy"`
- 明确的 `width` 和 `height` 属性以防止 CLS
- 压缩：目标 hero 图片 <100KB，缩略图 <20KB

---

## 减少 JavaScript 包

- 代码分割：仅加载当前路由需要的内容
- Tree shaking：消除未使用的导出（确保 package.json 中 `"sideEffects": false`）
- 审计依赖：`import-cost` 或 `bundlephobia.com` 检查大小影响
- 延迟非关键脚本：`<script defer>` 或动态 `import()`
- 移除死代码和未使用的导入

---

## 优化 CSS

- 移除未使用的样式（Tailwind 项目用 PurgeCSS）
- 避免 CSS 中的 `@import`（创建顺序请求）
- 关键 CSS 内联在 `<head>` 中，其余延迟
- 没有 `!important` 链——它们阻止高效的级联解析

---

## 优化字体

- 正文字体用 `font-display: swap`（用 FOUT 立即渲染）
- 装饰字体用 `font-display: optional`（慢则跳过）
- 预加载关键字重：`<link rel="preload" as="font">`
- 同一家族的 3+ 字重用 variable 字体
- 度量匹配的降级以最小化布局移动

---

## 渲染性能

### 避免布局抖动

批量 DOM 读取然后写入。在循环中读取然后写入布局属性会强制浏览器在每次迭代时重新计算布局：

```js
// BAD：每次迭代强制重新计算
elements.forEach(el => { el.style.height = el.offsetHeight + 10 + 'px' })

// GOOD：先读所有，再写所有
const heights = elements.map(el => el.offsetHeight)
elements.forEach((el, i) => { el.style.height = heights[i] + 10 + 'px' })
```

### GPU 加速属性

仅动画 `transform` 和 `opacity`——它们在合成器线程上运行，不会触发布局或绘制。绝不要动画：`width`、`height`、`top`、`left`、`padding`、`margin`、`border`。

### CSS Containment

```css
.card { contain: layout style; }
.feed-item { content-visibility: auto; contain-intrinsic-size: 200px; }
```

`content-visibility: auto` 跳过渲染直到需要的屏幕外内容——对长页面有巨大提升。

### 虚拟滚动

对于 500+ 项的列表，仅渲染可见行。库：`@tanstack/react-virtual`、`react-window`。绝不渲染 10,000 个 DOM 节点。

---

## 动画性能

- 目标 60fps；如果低于 50fps 就简化效果
- 在动画开始前添加 `will-change: transform`，之后移除
- 对 JavaScript 驱动的动画使用 `requestAnimationFrame`
- 将昂贵效果（模糊、过滤器、阴影）绑定到小区域——全屏 60fps 模糊很难

---

## React/框架优化

- 对昂贵渲染用 `React.memo` 和 `useMemo`——但先分析
- 对依赖数组中的稳定函数引用用 `useCallback`
- 对基于路由的代码分割用 `React.lazy` + `Suspense`
- 对非紧急状态更新用 `startTransition`
- 用 Profiler DevTools 识别实际慢的东西（不要猜测）

---

## Core Web Vitals

**LCP < 2.5s**：优化最大的图片/文本块。预加载 hero 图片。服务端渲染 above-fold 内容。

**INP < 200ms**：减少 JavaScript 执行。用 `setTimeout(fn, 0)` 或 `scheduler.yield()` 分解长任务。用 `startTransition` 处理非紧急更新。

**CLS < 0.1**：为图片保留空间（`width`/`height` 属性）。避免在现有内容上方插入内容。Web 字体不会导致布局移动（使用降级）。

---

## 网络优化

- HTTP/2 或 HTTP/3（多路复用消除连接开销）
- 对静态资源使用积极缓存头（哈希文件名）
- 预连接到第三方来源：`<link rel="preconnect">`
- 避免渲染阻塞第三方脚本——延迟或异步加载

---

## 绝不

- 没有测量数据就优化
- 为性能牺牲无障碍
- 在每个元素上使用 `will-change`——它创建新的堆叠上下文并消耗 GPU 内存
- 懒加载 above-fold 内容
- 假设桌面性能代表移动端（在真实中档设备上测试）

---

## 验证

在具有真实网络条件的真实设备上测试（3G 节流，不是光纤）。运行 Lighthouse、WebPageTest 或 Chrome DevTools Performance panel。用相同的测量方法比较之前和之后。