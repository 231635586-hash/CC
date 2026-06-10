# Craft Flow（工艺流）

> 以卓越的 UX 和 UI 质量构建功能：先 Shape 设计，确定视觉方向，构建真实的生产代码，在浏览器中检查和改进，直到达到高端工作室水准。

在写代码之前，你需要：已加载 PRODUCT.md、已识别并加载匹配的 register 参考文件、以及此任务已确认的设计方向（要么来自 `shape`，要么由用户提供）。PRODUCT.md 是项目上下文，不是任务特定的 brief。

将任何已批准视觉方向（生成的 mock 或声明的参考）视为关于组合、层级、密度、氛围、签名主题和独特视觉动作的具体契约。不要让 mock 取代结构、文案、可访问性或状态设计。但如果最终结果缺少已批准方向的主要成分，实现就是错误的。

---

## 门控：不压缩

Craft 有**多个用户门控**，不是一个。当 harness 有原生图像生成时，代码前的门控顺序是：

1. **Shape brief 已确认**（第 1 步）
2. **方向问题已回答**（codex.md 第 A 步）
3. **调色板已确认**（codex.md 第 B 步）
4. **一个 mock 方向已批准或委托**（codex.md 第 D 步）

在每个门控处停止。**Shape 确认本身不是开始编码的绿灯。** 它是开始方向问题的绿灯。因为 shape brief 感觉完整就压缩门控 2 到 4，是这个流程的主要失败模式。

当 harness 缺少原生图像生成时，门控 2–4 折叠到 brief 本身，shape 确认直接进入代码。

---

## 第 0 步：项目基础

在 shape 之前，在代码之前：弄清楚你正在处理什么类型的项目。

检查：
- 现有框架：`astro.config.mjs/ts`、`next.config.js/ts`、`nuxt.config.ts`、`svelte.config.js`、`vite.config.js/ts`、带框架依赖的 `package.json`。**如果找到，使用它。** 不要引入第二个框架。不要直接写入 `dist/` 或 `build/`。
- 现有组件库或设计系统：`src/components/`、`app/components/`、`tokens.css` / `theme.ts`。添加内容前先阅读已有的内容。
- 现有图标集：`lucide-react`、`@phosphor-icons/react`、`@iconify/*`、手绘 SVG sprites。**使用项目中已有的**；不要引入第二套。

如果目录为空（新项目），询问用户要构建什么，并用 brief 的合理默认值框定：
- Astro — 用于内容驱动的品牌站点、落地页、营销页面
- SvelteKit / Next.js / Nuxt — 当 brief 暗示应用界面或大量交互性时
- 单个 index.html — 一次性演示、原型或刻意无框架实验

默认：品牌 brief 用 Astro，产品 brief 用项目现有框架。问一次；不要在任务中途重新问。

---

## 第 1 步：Shape 设计

运行 `/impeccable shape`，传递用户提供的任何功能描述。Shape 对 craft 是**必需的**——它产生一个确认的方向。

呈现 shape 输出并停止。等待用户确认、覆盖或纠正，然后再写代码。

如果用户已经提供了已确认的 brief 或单独运行了 shape，使用它并跳过此步骤。

当原始提示 + PRODUCT.md 已经回答了范围、内容和视觉方向，没有真正的模糊性时，shape 输出可以是**紧凑的**（3–5 个要点说明你要构建什么和视觉车道，以一两个具体问题或"确认或覆盖"结束）。完整的结构化 brief 保留用于真正模糊的、多屏幕的或利益相关者繁重的任务。不要把一个清晰的 brief 填充成长 one 来显得全面；同样，不要跳过暂停来显得高效。

---

## 第 2 步：加载参考文件

根据设计 brief 的"推荐参考"部分，查阅相关参考文件。至少始终查阅：

- `reference/cognitive-load.md` — 认知负荷规则
- `reference/color-and-contrast.md` — 颜色与对比度
- `reference/interaction-design.md` — 交互设计（当涉及状态时）
- `reference/spatial-design.md` — 空间设计（当涉及布局时）

根据任务性质选择性查阅：
- `reference/motion-design.md` — 动效设计（如有动画）
- `reference/typography.md` — 字体排版（如有文字层级问题）
- `reference/ux-writing.md` — UX 文案（如有文案问题）

---

## 第 3 步：建立视觉方向

在码代码之前，你需要一个已批准的方向——或者来自 shape 输出，或者来自用户提供的具体引用。

当 harness 有原生图像生成时，门控序列包括：
1. 方向探索问题（第 A 步）
2. 调色板确认（第 B 步）
3. 关键词确认（第 C 步）
4. Mock 方向批准或委托（第 D 步）

在每个门控处停止并等待确认。压缩这些门控是主要失败模式。

当 harness 缺少图像生成时，brief 本身承担方向探索角色，shape 确认直接进入代码。

---

## 第 4 步：构建代码

基于已确认的方向，构建真实的、可运行的生产代码。

**必须包含的内容：**
- 所有交互状态的完整覆盖（default, hover, focus, active, disabled, loading, error, success）
- 真实的交互逻辑，不仅仅是静态 UI
- 自适应布局
- 模拟业务数据（当需要时）
- 预留真实接口对接点位
- 组件化结构
- 注释与部署说明

**必须避免的内容（AI Slop 测试失败）：**
- 模板化的卡片网格
- 居中的 hero + 三个等宽功能卡片
- AI 紫色渐变
- 通用名称（John Doe、Sarah Chan）
- 假精确数字（92%、99.99%）
- em-dash 作为设计元素
- 悬停才有的基本功能

---

## 第 5 步：浏览器检查

在浏览器中检查构建结果。迭代改进直到达到高端工作室水准。

**检查清单：**
- [ ] 按钮对比度通过 WCAG AA（4.5:1）
- [ ] 表单对比度通过 WCAG AA
- [ ] 键盘导航正常
- [ ] 触摸目标 ≥44×44px
- [ ] 空状态有设计
- [ ] 加载状态有骨架屏
- [ ] 错误状态有清晰提示
- [ ] 深色/浅色模式都正常
- [ ] 动画尊重 prefers-reduced-motion
- [ ] LCP < 2.5s（如果可测量）

---

## 第 6 步：最终自检

运行 `polish` 检查表中的项目。确保：
- 所有文本已重新阅读，没有 AI 幻觉短语
- 没有 em-dash
- CTA 标签没有换行
- 没有重复 CTA 意图
- 每个动画都有动机
- 图片是真实的（不是 div 假截图）