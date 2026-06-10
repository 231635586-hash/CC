# Responsive Design（响应式设计）

---

## 移动优先方法

使用 `min-width` 媒体查询，而不是桌面优先的 `max-width`。桌面优先迫使移动浏览器加载不必要的样式然后覆盖它。

**内容驱动断点**：不要针对特定设备。从窄开始，拉伸直到设计破坏，在那里添加断点。三个标准断点（640、768、1024px）通常足够。`clamp()` 提供无断点的流体替代方案。

---

## 输入方法比屏幕大小更重要

屏幕大小不能告诉你输入方法。使用：
- `@media (pointer: coarse)` — 触摸用户
- `@media (hover: none)` — 无悬停能力

**绝不要依赖悬停实现功能。** 触摸用户不能悬停。

---

## 触摸目标

所有交互元素的最小 44×44px。小视觉元素（如 24px 图标）需要通过 padding 或伪元素隐藏扩展触摸目标：

```css
.icon-btn::after {
  content: '';
  position: absolute;
  inset: -10px;
}
```

---

## 缺口设备

使用 `env(safe-area-inset-*)` 配合后备，与 `viewport-fit=cover` 在你的 meta 标签中配对：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
padding-bottom: max(1rem, env(safe-area-inset-bottom));
```

---

## 响应式图像

```html
<img
  srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src="image-800.webp"
  alt="..."
>
```

对艺术方向使用 `<picture>`（每个断点的不同裁剪）。

---

## 自适应网格

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

无需媒体查询即可自然适应。

---

## 测试现实

在真实设备上测试——不仅仅是 DevTools。模拟遗漏：真实的触摸交互、真实 CPU/内存约束、网络延迟模式以及 OS 级文本大小设置。