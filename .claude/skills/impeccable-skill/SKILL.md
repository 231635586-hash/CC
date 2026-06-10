---
name: impeccable-frontend
description: High-fidelity frontend design agent. Designs and iterates production-grade frontend interfaces with craft, shape, critique, audit commands.
---

# Impeccable: 前端设计 Agent

> **Impeccable** — v3.5.0, Apache 2.0. 设计并迭代生产级前端界面。真实可运行代码、坚定的设计选择、卓越的工艺。

## 概述

覆盖范围：网站、落地页、仪表盘、产品 UI、应用外壳、组件、表单、设置、首次引导和空状态。处理 UX 评审、视觉层级、信息架构、认知负荷、无障碍、性能、响应式行为、主题化、反模式、字体排版、字体、间距、布局、对齐、颜色、动画、微交互、UX 文案、错误状态、边界情况、i18n 以及可复用的设计系统或 tokens。**不适用于纯后端或非 UI 任务。**

---

## 何时使用此技能

触发条件：任何 `/impeccable` 命令，或当用户请求前端设计帮助时——构建 UI、评审设计、打磨、审计无障碍、改善字体排版、颜色、布局、动画或整体视觉质量。

---

## 开始前的准备（Setup — 执行任何设计工作前必做）

### 第 1 步：加载上下文
检查项目中是否存在 `PRODUCT.md` 和 `DESIGN.md`（同时检查 `.agents/context/` 和 `docs/` 作为备选路径）。

### 第 2 步：识别注册类型（Register）
识别项目是 **Brand** 还是 **Product** 注册类型，然后加载对应的参考文件：`reference/brand.md` 或 `reference/product.md`。

### 第 3 步：加载子命令参考文件
如果调用了子命令（如 `craft`、`shape`、`audit`），也必须加载其对应的参考文件。这是强制要求——`craft` 没有 `craft.md` 会跳过用户期望的 shape-and-confirm 步骤。

**注意**：如果 `PRODUCT.md` 缺失或仅为占位符（<200 字符、包含 `[TODO]` 标记），先运行 `/impeccable teach`，然后用新的上下文恢复原任务。
如果 `DESIGN.md` 缺失，每个 session 提示一次（*"Run `/impeccable document` for more on-brand output"*），然后继续执行。

---

## 注册类型（Register）

每个设计任务都属于以下两个注册类型之一：

- **Brand（品牌型）**：营销、落地页、活动、长篇内容、作品集 —— 设计本身就是产品
- **Product（产品型）**：应用 UI、管理后台、仪表盘、工具 —— 设计服务于产品

**设计前必先识别。** 优先级顺序：
1. 任务本身的线索（"landing page" vs "dashboard"）
2. 聚焦的表面（正在处理的页面、文件或路由）
3. `PRODUCT.md` 中的 `register` 字段

首次匹配优先。如果 `PRODUCT.md` 缺少 `register` 字段，从"Users"和"Product Purpose"部分推断一次，在 session 中缓存，并建议运行 `/impeccable teach` 显式添加。

---

## 通用设计法则（Shared Design Laws）

适用于所有设计（两种注册类型）。跨项目变化，避免趋同。

### 颜色（Color）

- 使用 **OKLCH**。当亮度趋近 0 或 100 时降低色度——极端亮度的高色度看起来很刺眼。
- 永远不要使用 `#000` 或 `#fff`。将所有中性色微调向品牌色调（色度 0.005–0.01 就足够自然且不会看起来像调过色）。
- **选择颜色策略先于选择颜色。** 承诺轴上的四个步骤：
  - **Restrained（克制）**：着色中性色 + 一个 ≤10% 的 accent。产品的默认选择；品牌的极简主义。
  - **Committed（坚定）**：一个饱和色承载 30–60% 的表面。品牌身份驱动页面的品牌默认选择。
  - **Full palette（全色调色板）**：3–4 个命名角色，每个都刻意使用。品牌活动；产品数据可视化。
  - **Drenched（浸染）**：表面本身就是颜色。品牌 hero；活动页面。
- "一个 accent ≤10%" 规则仅适用于 Restrained。Committed / Full palette / Drenched 是故意超出该比例的。不要本能地将每个设计都压缩为 Restrained。
- 彩色背景上的灰色文本永远是错误的。使用背景颜色的深色阴影代替。
- **WCAG**：正文文本 ≥4.5:1，UI 组件 ≥3:1。占位符文本也需要 4.5:1。

### 主题（Theme）

深色 vs 浅色从来不是默认值。不是深色"因为工具深色看起来酷"。不是浅色"为了安全"。

选择之前，先写一句物理场景：谁在使用、在哪里、在什么环境光下、什么情绪。如果这句话不能强迫得出答案，说明它不够具体。添加细节直到可以。

"可观察性仪表盘"不能强迫得出答案。"SRE 在凌晨 2 点昏暗的房间里盯着 27 英寸显示器查看事件严重程度"可以。运行场景，不是分类。

### 字体排版（Typography）

- 正文行长限制在 65–75ch。
- 通过比例 + 字重对比建立层级（相邻级别比例 ≥1.25）。避免平坦的比例。
- 标题使用 `text-wrap: balance`。
- 正文字体最小 16px。绝不禁用缩放。

### 布局（Layout）

- 变化间距以创造节奏。处处相同的内边距是单调的。使用 4pt 基准刻度：4, 8, 12, 16, 24, 32, 48, 64, 96px。
- Flexbox 用于一维，Grid 用于二维。
- 卡片是偷懒的答案。仅在真正最好的可发现性时才使用。嵌套卡片永远是错的。
- 不要把所有东西都包在容器里。大多数东西不需要容器。

### 动画（Motion）

- 不要动画 CSS 布局属性。
- 使用指数曲线缓出（ease-out-quart / quint / expo）。不要弹跳，不要弹性。
- 大多数过渡 150–250ms。退出动画时长约为进入的 75%。
- 始终包含 `@media (prefers-reduced-motion: reduce)`。

### 文案（Copy）

- 每个词都值得它的位置。没有重复标题的文案，没有重复标题的介绍。
- 具体的动词+宾语按钮标签："Save changes" 不是 "OK"，"Create account" 不是 "Submit"。
- 错误消息：发生了什么 + 为什么 + 接下来做什么。
- **禁止 em dashes。** 使用逗号、冒号、分号、句号或括号。也不要使用 `--`。

### 认知负荷（Cognitive Load）

- 任何决策点的 working memory 中 ≤4 个项目（导航、表单、操作按钮、定价层级）。
- 渐进披露：仅在用户需要时揭示复杂性。
- 一致的模式：相同类型的操作 = 相同类型的 UI，永远。

---

## 绝对禁止（Absolute Bans）

匹配即拒绝。如果你要写以下任何一个，用不同结构重写元素。

- **侧条纹边框。** 卡片、列表项、提示框或警告上的 `border-left` 或 `border-right` >1px 作为彩色 accent。用完整边框、背景色调、前导数字/图标或什么都不用重写。
- **渐变文本。** 使用 `background-clip: text` 加渐变。用纯色；通过字重或大小强调。
- **默认 Glassmorphism。** 装饰性地使用模糊和玻璃卡片。罕见且有目的，或不用。
- **Hero 指标模板。** 大数字、小标签、支持性统计、渐变 accent。SaaS 陈词滥调。
- **相同的卡片网格。** 相同大小的卡片带图标 + 标题 + 文本，无限重复。
- **首先想到 Modal。** 先穷尽内联/渐进替代方案。
- **`outline: none` 没有替代方案。** 无障碍违规。
- **仅悬停交互。** 触摸用户不能悬停——绝不把基本功能放在悬停后面。
- **大面积使用纯黑（`#000`）。** 甚至你最深的表面也要调色。

---

## AI Slop 测试（The AI Slop Test）

如果有人看着这个界面可以肯定地说"AI 做的"，它就失败了。跨注册类型的失败是上述绝对禁止。注册特定的失败在每个参考文件中。

**类别反射检查。** 在两个高度运行——第二个捕捉第一个遗漏的内容。

- **一阶：** 如果有人仅从类别就能猜测主题 + 调色板（"可观察性 → 深蓝"、"医疗 → 白色 + 青色"、"金融 → 藏蓝 + 金"、"加密 → 霓虹黑"），这是一阶训练数据反射。重写场景句子和颜色策略，直到答案从领域中不明显。
- **二阶：** 如果有人能从类别+反引用猜测审美家族（"非 SaaS 奶油色的 AI 工作流工具 → 编辑型字体排版"、"非藏蓝+金的金融科技 → 终端原生深色模式"），这是更深的陷阱。一阶反射被避免了；二阶没有。重写直到两个答案都不明显。

---

## 命令列表（Commands）

| 命令 | 类别 | 描述 | 参考文件 |
|---------|----------|-------------|-----------|
| `craft [feature]` | Build（构建） | 先 Shape，再端到端构建功能 | reference/craft.md |
| `shape [feature]` | Build（构建） | 写代码前先规划 UX/UI | reference/shape.md |
| `teach` | Build（构建） | 设置 PRODUCT.md 和 DESIGN.md 上下文 | reference/teach.md |
| `document` | Build（构建） | 从现有项目代码生成 DESIGN.md | reference/document.md |
| `extract [target]` | Build（构建） | 提取可复用 tokens 和组件 | reference/extract.md |
| `critique [target]` | Evaluate（评估） | UX 设计评审 + 启发式评分 | reference/critique.md |
| `audit [target]` | Evaluate（评估） | 技术质量检查（无障碍/性能/响应式） | reference/audit.md |
| `polish [target]` | Refine（打磨） | 发送前的最终质量通过 | reference/polish.md |
| `bolder [target]` | Refine（打磨） | 放大安全或平淡的设计 | reference/bolder.md |
| `quieter [target]` | Refine（打磨） | 调低激进或过度刺激的设计 | reference/quieter.md |
| `distill [target]` | Refine（打磨） | 剥离本质，移除复杂性 | reference/distill.md |
| `harden [target]` | Refine（打磨） | 生产就绪：错误/i18n/边界情况 | reference/harden.md |
| `onboard [target]` | Refine（打磨） | 设计首次体验流、空状态、激活 | reference/onboard.md |
| `animate [target]` | Enhance（增强） | 添加有目的的动画和动效 | reference/animate.md |
| `colorize [target]` | Enhance（增强） | 为单色 UI 添加战略性颜色 | reference/colorize.md |
| `typeset [target]` | Enhance（增强） | 改善字体排版层级和字体 | reference/typeset.md |
| `layout [target]` | Enhance（增强） | 修复间距、节奏和视觉层级 | reference/layout.md |
| `delight [target]` | Enhance（增强） | 添加个性和令人难忘的触感 | reference/delight.md |
| `overdrive [target]` | Enhance（增强） | 超越常规极限 | reference/overdrive.md |
| `clarify [target]` | Fix（修复） | 改善 UX 文案、标签和错误消息 | reference/clarify.md |
| `adapt [target]` | Fix（修复） | 为不同设备和屏幕尺寸适配 | reference/adapt.md |
| `optimize [target]` | Fix（修复） | 诊断并修复 UI 性能 | reference/optimize.md |
| `live` | Iterate（迭代） | 视觉变体模式：在浏览器中选择元素，生成替代方案 | reference/live.md |

上下文注册文件（在 setup 期间加载，不直接调用）：`reference/brand.md`、`reference/product.md`。

---

## 快捷命令绑定（Pin / Unpin）

**Pin** 创建一个独立快捷方式，使 `/<command>` 直接调用 `/impeccable <command>`。**Unpin** 移除它。

```bash
node .claude/skills/impeccable/scripts/pin.mjs <pin|unpin> <command>
```

有效的 `<command>` 是上表中的任何命令。简洁报告脚本结果。成功后确认新快捷方式，出错时原样转发 stderr。

---

## 路由规则（Routing Rules）

1. **无参数**：将上面的命令表呈现为用户菜单，按类别分组。询问用户想做什么。
2. **第一个词匹配命令**：加载其参考文件并遵循其指令。命令名后的所有内容作为目标。
3. **第一个词不匹配**：通用设计调用。使用完整参数作为上下文，应用 setup、通用设计法则和注册参考。

Setup（上下文收集、register）已加载；子命令不会重新调用 `/impeccable`。

---

## 内部支撑参考文件（Supporting Reference Files）

这些文件不直接调用，而是由需要的命令加载：

| 参考文件 | 用途 | 主要使用者 |
|---------|----------|-------------|
| `reference/cognitive-load.md` | Working memory 规则、负载类型、8 种违规模式 | → critique, audit, polish |
| `reference/color-and-contrast.md` | OKLCH 深入探讨、调色板结构、WCAG、深色模式、token 层级 | → colorize, audit, critique |
| `reference/heuristics-scoring.md` | Nielsen 10 启发法、0–40 评分量表 | → critique |
| `reference/motion-design.md` | Timing 表、缓动曲线、动画材料、无障碍 | → animate, overdrive |
| `reference/personas.md` | Alex、Jordan、Sam、Riley、Casey — 五个测试原型 | → critique, shape |
| `reference/responsive-design.md` | 移动优先、输入方法检测、触摸目标、缺口设备 | → adapt, audit, harden |
| `reference/spatial-design.md` | 4pt 刻度、容器查询、眯眼测试、触摸目标扩展 | → layout, polish |
| `reference/typography.md` | 垂直节奏、层级、字体选择、Web 性能 | → typeset, audit |
| `reference/ux-writing.md` | 按钮标签、错误消息、空状态、语气、i18n 检查表 | → clarify, polish |
| `reference/interaction-design.md` | 八种交互状态、现代浏览器 API、无障碍 | → craft, harden, audit |