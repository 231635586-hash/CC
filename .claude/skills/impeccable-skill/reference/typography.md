# Typography（字体排版）

---

## 核心原则

**垂直节奏**：Line-height 作为所有间距的基础单位。在 16px 字体（24px 计算值）上使用 `line-height: 1.5`，所有间距应使用 24px 倍数以获得视觉和谐。

**层级**：更少的大小配合更多对比度胜过多 个相似的大小。五级系统（xs、sm、base、lg、xl+）通常足够。使用比例：1.25（小三度）、1.333（完全四度）或 1.5（完全五度）。

**可读性**：使用 `ch` 单位进行基于字符的测量：`max-width: 65ch`。对于深色背景上的浅色文本，将 line-height 增加 0.05–0.1，添加字间距（0.01–0.02em），并可选择将正文字重提高一级。

---

## 字体选择

抵制本能选择——科技产品不需要衬线来增加温暖，"现代"不意味着几何无衬线。

**搭配策略**：通常你不需要第二种字体。一个家族多个字重创建更清晰的层级。搭配时，在结构、个性或比例轴上对比。

**系统字体**（`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`）提供即时加载和原生外观。对产品 UI 是有效选择。

---

## Web 字体性能

- `font-display: swap` — 立即可见，接受 FOUT
- `font-display: optional` — 慢网络上零布局移动
- 仅预加载关键字重
- 同一家族 3+ 字重用 variable 字体

---

## 两种上下文

**品牌/营销**：相邻层级比例 ≥1.25 的流体 `clamp()` 缩放。体现品牌个性的独特字体。

```css
h1 { font-size: clamp(2rem, 5vw, 4rem); }
```

**产品/UI**：1.125–1.2 比例的固定 `rem` 比例。界面上一个调优良好的无衬线家族。应用 UI 中绝不用流体字体——它在不可预测的时刻变化。

---

## 实现

- **5 级字体比例**：caption、secondary、body、subheading、heading
- 每个家族最多 **3–4 个字重**；仅加载你使用的
- 文本容器上 `max-width: 65ch`
- Line-height：标题 1.1–1.2，正文 1.5–1.7
- 语义 token 名称：`--text-body`，不是 `--text-16`
- 标题上 `text-wrap: balance` 以避免孤行

---

## 现代技术

- **OpenType 特性**：数据的等宽数字、小型大写字母、连字
- **`font-variant-numeric: tabular-nums`** 用于表中对齐的数字
- **`text-wrap: pretty`** 用于段落孤行控制（Chrome 117+）

---

## 无障碍

- 正文字体最小 16px
- 绝不禁用缩放（`user-scalable=no` 是违规）
- 使用 `rem`/`em` 进行字体大小，而不是 `px`——尊重用户浏览器设置
- 文本链接的触摸目标 44px+