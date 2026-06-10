---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop 前端技能规范

> 专用于落地页、作品集和重新设计。不适用于后台、仪表盘、数据表格、多步产品 UI。
> 以下每条规则都是**情境化**的，不会自动触发。先读懂需求简报，再只取符合项目的规则。

---

## 0. brief inference（先读懂需求再动手）

在触碰代码或调整刻度盘之前，**先推断用户真正想要什么**。大多数 LLM 设计输出质量差，是因为模型直接跳入默认审美，而没有先理解项目背景。

### 0.A 先读这些信号
1. **页面类型** - 落地页（SaaS / 消费级 / 代理商 / 活动）、作品集（开发者 / 设计师 / 创意工作室）、重新设计（保留 vs 全面改造）、编辑型 / 博客型。
2. **用户使用的氛围词汇** - "极简"、"平静"、"Linear 风格"、"Awwwards"、"粗野主义"、"高端消费级"、"Apple 风格"、"活泼"、"严肃 B2B"、"编辑型"、"代理商风格"、"玻璃质感"、"暗色科技"。
3. **参考信号** - 用户链接的 URL、粘贴的截图、提到的产品或品牌、竞争对手。
4. **受众** - B2B 采购决策者 vs 注重设计的消费者 vs 扫描作品集的招聘官。受众决定审美，不由你的品味决定。
5. **已有的品牌资产** - logo、颜色、字体、摄影图。重新设计中，这些是起点素材，不是可选项输入（见第 11 节）。
6. **隐性约束** - 无障碍优先受众、公共部门、受监管行业、信任优先的商业、儿童产品。这些约束**优先于**审美偏好。

### 0.B 生成一行"设计研判"再开始生成
在任何代码之前，用一行声明：**"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."**

示例研判：
- *"Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."*
- *"Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."*
- *"Reading this as: redesign of a public-sector service site, with a trust-first language, leaning toward GOV.UK Frontend or USWDS."*

### 0.C 如果需求模糊，问一个问题，不要猜测
只问**一个**澄清问题——绝不一次性抛出多个问题——且仅在设计研判确实有分歧时。示例：*"Should this feel closer to Linear-clean or Awwwards-experimental?"*

如果能根据上下文自信推断，**不要问**。直接声明设计研判并继续。

### 0.D 反默认纪律
不要默认使用：AI 紫色渐变、深色网格上的居中 hero、三个等宽功能卡片、千篇一律的 glassmorphism、无处不在的无限循环微动画、Inter + slate-900。这些是 LLM 默认项。要根据设计研判刻意超越它们。

---

## 1. 三个刻度盘（核心配置）

完成设计研判（第 0 节）和刻度盘（第 1 节）后，选择正确的基础。不要为已有官方包的东西发明 CSS。不要把审美趋势假装成官方系统。

### 1.A 刻度盘推断（设计研判 → 刻度值）
| 信号 | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "极简 / 干净 / 平静 / 编辑型 / Linear 风格" | 5-6 | 3-4 | 2-3 |
| "高端消费级 / Apple 风格 / 奢侈品 / 品牌" | 7-8 | 5-7 | 3-4 |
| "活泼 / 狂野 / Dribbble / Awwwards / 实验性 / 代理商" | 9-10 | 8-10 | 3-4 |
| "落地页 / 作品集 / 营销站（默认）" | 7-9 | 6-8 | 3-5 |
| "信任优先 / 公共部门 / 受监管 / 无障碍关键" | 3-4 | 2-3 | 4-5 |
| "重新设计 - 保留" | 匹配现有 | +1 | 匹配现有 |
| "重新设计 - 全面改造" | +2 | +2 | 匹配现有 |

### 1.B 使用场景预设
| 使用场景 | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| 落地页（SaaS，主流） | 7 | 6 | 4 |
| 落地页（代理商 / 创意） | 9 | 8 | 3 |
| 落地页（高端消费级） | 7 | 6 | 3 |
| 作品集（设计师 / 工作室） | 8 | 7 | 3 |
| 作品集（开发者） | 6 | 5 | 4 |
| 编辑型 / 博客 | 6 | 4 | 3 |
| 公共部门服务 | 3 | 2 | 5 |
| 重新设计 - 保留 | 匹配 | 匹配+1 | 匹配 |
| 重新设计 - 全面改造 | +2 | +2 | 匹配 |

### 1.C 刻度盘如何驱动输出
使用这些（或用户覆盖的值）作为全局变量。本文档中的交叉引用都指向这些确切变量名——绝不发明别名如 `LAYOUT_VARIANCE` 或 `ANIM_LEVEL`。

---

## 2. brief → 设计系统映射

完成设计研判（第 0 节）和刻度盘（第 1 节）后，选择正确的基础。

### 2.A 何时使用真实设计系统（使用官方包）
| 需求研判为…… | 使用 | 原因 |
|---|---|---|
| Microsoft / 企业 SaaS / 仪表盘 | `@fluentui/react-components` 或 `@fluentui/web-components` | 官方 Fluent UI、Microsoft tokens、无障碍已处理 |
| Google 风格 UI、Material 产品风 | `@material/web` + Material 3 tokens | 官方、可通过 Material Theming 主题化 |
| IBM 风格 B2B / 企业分析 | `@carbon/react` + `@carbon/styles` | 官方 Carbon、成熟的数据密度模式 |
| Shopify 应用界面 | `polaris.js` web components / Polaris React | Shopify 管理 UI 必需 |
| Atlassian / Jira 风格产品 | `@atlaskit/*` + `@atlaskit/tokens` | 官方 Atlassian DS |
| GitHub 风格开发工具 / 社区页 | `@primer/css` 或 `@primer/react-brand` | 官方 Primer；Brand 变体用于营销 |
| 英国公共部门服务 | `govuk-frontend` | 法律 / 监管预期 |
| 美国公共部门 / 信任优先 | `uswds` | 同上 |
| 快速本地业务 / 代理商 MVP | Bootstrap 5.3 | 无聊但快速、管用 |
| 现代可访问 React 基础 | `@radix-ui/themes` | 原语 + 精致主题 |
| 现代 SaaS（自己掌控组件） | shadcn/ui (`npx shadcn@latest add ...`) | 代码自有、易定制；绝不发送默认状态 |
| Tailwind 现代 SaaS / AI 营销 | Tailwind v4 utilities + `dark:` 变体 | indie + 小团队构建的默认选择 |

**诚实规则：** 如果需求符合上述某个系统，安装并使用**官方**包。不要手工重造其 CSS。不要导入了系统的 tokens 却覆盖了 90% 的内容。

**一个项目一个系统。** 不要在同一个组件树中混用 Fluent React 和 Carbon。不要将 shadcn/ui 组件导入 Material 3 应用。

### 2.B 何时是审美而非系统
对于这些方向，**没有单一的官方包**。使用原生 CSS + Tailwind + 一个维护中的组件库构建。在代码注释中诚实标注哪些是借鉴灵感、哪些是官方材料。

| 审美风格 | 诚实的实现方式 |
|---|---|
| Glassmorphism / "磨砂玻璃" | `backdrop-filter`、分层边框、高光叠加。为 `prefers-reduced-transparency` 提供实色降级方案。 |
| Bento（Apple 风格磁贴网格） | CSS Grid 混合单元格尺寸。没有单一库拥有这个。 |
| 粗野主义 | 原生 CSS、等宽字体、原始边框。没有库。 |
| 编辑型 / 杂志 | 衬线字体、不对称网格、充裕留白。没有库。 |
| 暗色科技 / hacker | 等宽 + accent 霓虹、终端元素。没有库。 |
| Aurora / 网格渐变 | SVG 或分层径向渐变。没有库。 |
| 动态字体 | 原生 CSS 动画、scroll-driven 动画、GSAP 用于 hijack。没有库。 |
| **Apple Liquid Glass** | Apple只为 Apple 平台文档化此效果。**网上没有官方的 `liquid-glass.css`。** Web 实现是用 `backdrop-filter` + 分层边框 + 高光近似的，标注为近似的。 |

---

## 3. 默认架构与约定

除非设计研判选择了真实设计系统（第 2.A 节），否则使用这些默认项：

### 3.A 技术栈
* **框架：** React 或 Next.js。默认为服务端组件（RSC）。
  * **RSC 安全：** 全局状态只在客户端组件中生效。在 Next.js 中，将 provider 包在 `"use client"` 组件中。
  * **交互隔离：** 任何使用 Motion、滚动监听器或指针物理的组件必须是隔离的叶组件，且文件顶部有 `'use client'`。服务端组件只渲染静态布局。
* **样式：** **Tailwind v4**（默认）。仅在现有项目要求时才用 v3。
  * v4: 不要在 `postcss.config.js` 中使用 `tailwindcss` 插件。使用 `@tailwindcss/postcss` 或 Vite 插件。
* **动画：** **Motion**（原 Framer Motion）。从 `motion/react` 导入（`import { motion } from "motion/react"`）。`framer-motion` 包作为遗留别名仍然可用——新代码中优先用 `motion/react`。
* **字体：** 始终使用 `next/font`（Next.js）或用 `@font-face` + `font-display: swap` 自托管。绝不通过 `<link>` 在生产环境链接 Google Fonts。

### 3.B 状态管理
* 本地 `useState` / `useReducer` 用于隔离的 UI。
* 全局状态仅在深度避免 prop drilling 时使用 - Zustand、Jotai 或 React context。
* **永远不要**用 `useState` 来追踪由用户输入驱动的连续值（鼠标位置、滚动进度、指针物理、磁性悬停）。使用 Motion 的 `useMotionValue` / `useTransform` / `useScroll`。`useState` 在每一帧变化时都会重新渲染 React 树，在移动端会崩溃。

### 3.C 图标
* **允许的库（优先级顺序）：** `@phosphor-icons/react`、`hugeicons-react`、`@radix-ui/react-icons`、`@tabler/icons-react`。
* **不推荐：** `lucide-react`。仅在用户明确要求或项目已依赖它时才可接受。
* **永远不要手写 SVG 图标。** 如果某个字形缺失，安装第二个库或用原语组合——不要凭空绘制图标路径。
* **一个项目一个图标家族。** 不要在同一个组件树中混用 Phosphor 和 Lucide。
* **全局统一 `strokeWidth`**（例如 `1.5` 或 `2.0`）。

### 3.D Emoji 政策
默认不推荐在代码、标记和可见文本中使用。用图标库的字符替换符号。**覆盖：** 仅在用户明确要求活泼 / 聊天风格 / 社交原生氛围时才允许 emoji——即使允许也要克制且有目的地使用。

### 3.E 响应式与布局机制
* 标准化断点（`sm 640`、`md 768`、`lg 1024`、`xl 1280`、`2xl 1536`）。
* 使用 `max-w-[1400px] mx-auto` 或 `max-w-7xl` 约束页面布局。
* **视口稳定性：** 绝对不要对全高 Hero 区域使用 `h-screen`。始终使用 `min-h-[100dvh]` 防止移动端布局跳动（iOS Safari 地址栏）。
* **Grid 优于 Flex 计算：** 绝对不要使用复杂的 flexbox 百分比算术（`w-[calc(33%-1rem)]`）。始终使用 CSS Grid（`grid grid-cols-1 md:grid-cols-3 gap-6`）。

### 3.F 依赖验证（强制）
在任何导入第三方库之前，检查 `package.json`。如果包缺失，先输出安装命令。**绝对不要**假设某个库已存在。

---

## 4. 设计工程指令（偏差校正）

LLM 默认会使用陈词滥调。主动覆盖这些默认项。每个规则都有情境化覆盖路径。

### 4.1 字体排版
* **展示 / 标题：** 默认 `text-4xl md:text-6xl tracking-tighter leading-none`。
* **正文 / 段落：** 默认 `text-base text-gray-600 leading-relaxed max-w-[65ch]`。
* **无衬线字体选择：**
  * **默认不推荐：** `Inter`。优先选择 `Geist`、`Outfit`、`Cabinet Grotesk`、`Satoshi`，或先选择品牌合适的衬线字体。
  * **覆盖路径：** 当用户明确要求中性 / 标准 / Linear 风格感受，或需求是公共部门 / 无障碍优先网站时，Inter 是可接受的。
* **已知搭配：** `Geist` + `Geist Mono`、`Satoshi` + `JetBrains Mono`、`Cabinet Grotesk` + `Inter Tight`、`GT America` + `IBM Plex Mono`。

* **衬线字体纪律（默认强烈不推荐）：**
  * 衬线字体**作为任何项目的默认字体都是强烈不推荐的。**"感觉有创意 / 高端 / 编辑型"不是使用衬线的理由。代理的默认心理模型"创意 brief = 衬线"是生产测试中最常见的 AI tell。
  * **仅在以下任一条件明确为真时才可接受衬线：**
    - 品牌 brief  literally 指定了某种衬线字体，或
    - 审美家族确实是编辑型 / 奢侈品 / 出版 / 手稿 / 遗产 / 复古**且**你能阐明为什么这个特定的衬线适合这个特定品牌
  * 对于其他一切（创意代理商、设计工作室、现代品牌、高端消费级、作品集、生活方式），**默认无衬线展示字体**（Geist Display、ABC Diatype、Söhne Breit、 Migra Sans、GT Walsheim、Inter Display、PP Neue Montreal）。无衬线展示字体不是"无聊"——它们是默认选择，原因与黑色在时尚界是默认选择相同。
  * **强调规则（相关）：** 当你想在标题中强调某个词（动态的"and `spatial` design"类型的操作），使用**同一字体的斜体或粗体**。不要仅仅为了增加视觉趣味，就在无衬线标题中注入随机衬线单词（反之亦然）。同族强调是专业做法。混搭字体强调是业余做法。
  * **默认明确禁止：** `Fraunces` 和 `Instrument_Serif`（两个 LLM 最爱的展示衬线）。
  * **如果衬线是合理的**（根据上述条件，很少），从这个池中轮换选择，不要在连续项目中重用相同的衬线：PP Editorial New、GT Sectra Display、Cardinal Grotesque、Reckless Neue、Tiempos Headline、Recoleta、Cormorant Garamond、Playfair Display、EB Garamond、IvyPresto、 Migra、Editorial Old、Saol Display、Söhne Breit Kursiv、Domaine Display、Canela、Schnyder、Tobias、NB Architekt、ITC Galliard。

* **斜体降部间隙（强制）：** 当斜体用于展示字体且单词包含降部字母（`y g j p q`）时，`leading-[1]` 或 `leading-none` 会裁剪降部。使用 `leading-[1.1]` 最小值，并在包装元素上添加 `pb-1` 或 `mb-1` 预留空间。在发送前审查每个斜体展示标题中的斜体单词。

### 4.2 颜色校准
* 最多 1 个accent 颜色。饱和度默认 < 80%。
* **紫色规则：** "AI 紫 / 蓝色光晕"审美默认不推荐。没有自动的紫色按钮光晕、没有随机的霓虹渐变。使用中性基色（Zinc / Slate / Stone）配合高对比度单一 accent（Emerald、电蓝、深玫瑰、焦橙等）。
* **覆盖：** 如果品牌或 brief 明确要求紫色 / 紫罗兰 / lila，照单全收。但要有意图地执行：一致的调色板、协调的中性色、克制的渐变。不是通用的 AI 渐变 slop。
* **一个项目一个调色板。** 不要在同一项目中在暖灰和冷灰之间摇摆。
* **颜色一致性锁定（强制）：** 一旦为页面选择了 accent 颜色，它就用于整个页面。暖灰色网站不会突然在第 7 节出现蓝色 CTA。玫瑰 accent 的网站不会在页脚出现青色状态徽章。选择一个 accent，锁定它，在发送前审查每个组件。

* **高端消费级调色板禁令（强制，第二常见的 AI tell）：**
  * 对于高端消费级 brief（炊具、健康、手工、奢侈品、遗产工艺、DTC 家居等），LLM 默认是**暖米色/奶油色 + 黄铜/陶土/绛红/赭石 + 浓咖啡/墨水深色文本**。作为默认背景和 accent 明确禁止的十六进制色系：
    - 背景：`#f5f1ea`、`#f7f5f1`、`#fbf8f1`、`#efeae0`、`#ece6db`、`#faf7f1`、`#e8dfcb`（都是"暖纸/奶油/粉笔/骨色"）
    - Accent：`#b08947`、`#b6553a`、`#9a2436`、`#9c6e2a`、`#bc7c3a`、`#7d5621`（都是"黄铜/陶土/绛红/赭石"）
    - 文本：`#1a1714`、`#1a1814`、`#1b1814`（都是"浓咖啡/暖近黑"）
  * 这个调色板作为高端消费级 brief 的默认选择是**被禁止的**。你曾经生成的所有高端消费级网站都使用这个确切调色板。品牌变得无差异化。
  * **默认替代选择（轮换，不要重用）：**
    - **冷奢华：** 银灰 + 铬 + 烟（想象 Tesla、Apple Watch Hermes 无皮革表带）
    - **森林：** 深绿 + 骨白 + 琥珀 accent（想象 Filson、Patagonia 高端线）
    - **黑棕：** 真正的近黑 + 暖棕，鲜明对比，无米色
    - **钴蓝 + 奶油：** 饱和蓝配单一中性，无黄铜
    - **陶土 + 石板：** 暖锈色配冷灰，无黄铜
    - **橄榄 + 砖红 + 纸色：** 柔和橄榄加砖红色 accent
    - **纯单色 + 单一饱和流行色：** 淡白 + 近黑 + 一个亮 accent（电蓝、翡翠、热粉等）
  * **调色板轮换规则：** 如果你上一个高端消费级项目使用了米色+黄铜家族，这个项目必须使用不同的家族。不要连续两次使用相同的暖工艺调色板。
  * **覆盖：** 米色+黄铜+浓咖啡调色板仅在品牌 brief 明确指定那些颜色，或品牌 identity 确实是复古/手工/暖工艺**且**你能阐明为什么这个特定调色板适合这个特定品牌时才可接受。"这是炊具 brief"不是默认选择的理由。

### 4.3 布局多样化
* **反居中偏见：** 当 `DESIGN_VARIANCE > 4` 时避免居中的 Hero / H1 区域。强制使用"分屏"（50/50）、"左对齐内容/右对齐资源"、"不对称留白"或滚动固定结构。
* **覆盖：** 当 brief 是编辑型 / 宣言 / 发布公告时，居中 hero 是可以的，此时信息本身就是设计。

### 4.4 材质感、阴影、卡片
* 仅在海拔传达真实层级时才使用卡片。否则用 `border-t`、`divide-y` 或负空间分组。
* 使用阴影时，将其着色为背景色调。浅色背景上不要使用纯黑色投影。
* 对于 `VISUAL_DENSITY > 7`：通用卡片容器被禁止。数据指标在平面布局中呼吸。
* **形状一致性锁定（强制）：** 为页面选择一种圆角系统并坚持它。选项：全尖锐（圆角 0）、全柔和（圆角 12-16px）、全胶囊（交互元素全圆角）。仅在有文档化规则时（如"按钮全胶囊，卡片 16px，输入框 8px"）才允许混用系统，且该规则要处处遵循。胶囊按钮放在方形布局中，或方角卡片放在胶囊按钮页上，都是破损的设计。

### 4.5 交互式 UI 状态
LLM 默认只输出"静态成功状态"。始终实现完整周期：
* **加载态：** 骨架加载器匹配最终布局形状。避免通用的圆形旋转器。
* **空状态：** 精心设计；指出如何填充。
* **错误状态：** 清晰、内联（表单），或上下文式（仅对临时状态使用 toast）。
* **触觉反馈：** 在 `:active` 时，使用 `-translate-y-[1px]` 或 `scale-[0.98]` 模拟物理按压。
* **按钮对比度检查（强制，无障碍）：** 发送任何按钮之前，验证按钮文本在按钮背景上可读。白色按钮 + 白色文本、`bg-white` CTA 配 `text-white` 标签、无边框的透明按钮对页面背景 → 全部禁止。在发送前审查每个 CTA：对比度比率 WCAG AA 最低（正文 4.5:1，大文本 18px+ 为 3:1）。相同规则适用于照片背景上的 ghost 按钮（使用背景层、scrim 或描边）。
* **CTA 按钮换行禁令（强制）：** 按钮文本在桌面端必须在一行内。如果类似"VIEW SELECTED WORK"的标签在桌面端换行成 2 或 3 行，按钮就是破损的。修复方法：要么缩短标签（主要 CTA 最多 3 个词，最好 1-2 个），要么加宽按钮（不要人为约束 CTA 上的 `max-width`）。桌面端换行的 CTA 是 Pre-Flight 失败。
* **无重复 CTA 意图（强制）：** 同一页面上两个意图相同的 CTA 是 Pre-Flight 失败。相同意图示例："Get in touch" + "Contact us" + "Let's talk" + "Start a project" + "Start something" + "Reach out" = 都是"联系"意图 → 在整个页面上选择一个标签并使用（导航、hero、页脚）。"Try free" + "Get started" + "Sign up free"（都是"注册"意图）和"View work" + "See selected work" + "Browse projects"（都是"作品集"意图）同理。每个意图一个标签。
* **表单对比度检查（强制，无障碍）：** 表单输入、占位符文本、焦点环、辅助文本和错误文本在节背景上都要通过 WCAG AA 对比度。浅色占位符在近白色表单上、白色表单在白色页面节上、比 4.5:1 对比度更灰的表单标签 → 全部禁止。在发送前审查每个表单。

### 4.6 数据和表单模式
* 标签在输入上方。辅助文本可选但在标记中存在。错误文本在输入下方。标准 `gap-2` 用于输入块。
* 永远不要用占位符代替标签。

### 4.7 布局纪律（硬规则。违反任何一条就是发送破损作品）

* **Hero 必须适配初始视口。** 标题在桌面最多 2 行，子文本最多 **20 个词** 最多 3-4 行，CTA 无需滚动即可见。如果文案太长：减小字号或削减文案。如果不能用 20 个词的子文本描述价值主张，价值主张不清晰，不是规则太严格。从不让 hero 溢出并强迫滚动以找到 CTA。
* **Hero 字号纪律。** 一起规划字号大小和图像大小。如果 hero 资源很大且标题超过 6 个词，不要从 `text-7xl/text-8xl` 开始。默认合理范围：大多数 hero 的 `text-4xl md:text-5xl lg:text-6xl`；仅当标题为 3-5 个词时才用 `text-6xl md:text-7xl`。4 行 hero 标题始终是字号错误，不是文案长度错误。
* **HERO 顶部内边距上限（强制）：** Hero 顶部内边距在桌面最多 `pt-24`（≈6rem）。超过这个值意味着 hero 内容悬停在视口中途，阅读起来像布局错误，而不是有意的空间。如果 hero 需要更多呼吸空间，增加字号或资源大小，而不是顶部内边距。
* **HERO 堆叠纪律（最多 4 个文本元素）。** Hero 是一个单一时刻，不是功能列表。允许的文本元素，最多 4 个：
  1. Eyebrow（小写大写标签）或品牌条或两者都没有——选择零或一个
  2. 标题（最多 2 行，见上方）
  3. 子文本（最多 20 个词，最多 4 行）
  4. CTA（1 个主要 + 最多 1 个次要）
  - **Hero 中禁止：** CTA 下方的微小标语（"Works with GitHub, GitLab, and self-hosted Git"）、信任微条（"Used by engineering teams at..."）、定价预告（"Free for solo, $10/user for teams"）、功能项目符号列表、社交证明头像行。所有这些都移到 hero 正下方的一个专门节。不要将信任 logo 塞进与 hero 文案相同的 flex 行中。
  - 如果在同一个 hero 中有 eyebrow 和 CTA 下方的标语，去掉标语。如果你有品牌条和标语，去掉标语。每个 hero 最多一个小文本元素。
* **"Used by" / "Trusted by" logo 墙属于 Hero 下方，绝不在 Hero 内部。** Hero 用于价值主张和主要 CTA。Logo 墙是 hero 正下方的一个单独节。不要将信任 logo 塞进与 hero 文案相同的 flex 行中。
* **导航必须在桌面单行渲染。** 如果项在 `lg`（1024px）不合适，收缩标签，删除次要项，或移至汉堡菜单。桌面双行导航是破损设计。
* **导航高度上限：桌面最多 80px，默认 64-72px。** 不要用占用视口 15% 的巨大"代理商"导航栏。
* **Bento 网格必须有节奏感，而不是单方面重复。** 不要堆叠 6 个左图/右文行。变化组合：交替全宽功能行、不对称磁贴尺寸、垂直分隔。
* **BENTO 单元格计数规则（强制）：** Bento 网格恰好有与内容数量相同的单元格。3 项 → 3 个单元格（1+2 分割，或 2+1，或不对称三人组）。5 项 → 5 个单元格（2+3、3+2、hero+4 等）。如果你的网格中间或末尾有空单元格，你规划错了。重塑网格；不要粘贴空白磁贴。
* **节布局重复禁令。** 一旦你为一个节使用了一种布局族（例如 3 列图像卡片、全宽引语、分屏文本图像），该族在页面上最多出现一次。"Selected commissions" 不能看起来像 "What we do"。有 8 节的落地页必须使用至少 4 种不同的布局族。
* **ZIGZAG 交替上限（强制）。** 交替"左图+右文"然后"左文+右图"的 zigzag 布局 = 平庸。最多连续 2 节使用这种图像+文本分割模式。第 3 个连续图像+文本分割是 Pre-Flight 失败。用全宽节、垂直堆叠节、bento 网格、 marquee 或不同的布局族打破模式。
* **EYEBROW 约束（强制，生产测试中违反最多的规则）。** "Eyebrow"是坐在节标题上方的小写大写宽字间距标签（例如 `FOUR COLORWAYS`、`SELECTED WORK`、`THE HARDWARE`、`Git-native task management`）。典型 CSS 特征：`text-[11px] uppercase tracking-[0.18em]`、`font-mono text-[10.5px] uppercase tracking-[0.22em]`。每个 AI 构建的网站在每个节标题上都放一个 eyebrow，产生相同的模板化节奏。硬规则：
  - **每 3 节最多 1 个 eyebrow。** Hero 计为 1。所以有 9 节的页面最多使用 3 个 eyebrows 总计。
  - 如果节 A 有 eyebrow，接下来的 2 节不能有。
  - **Pre-Flight Check 是机械的：** 统计所有节组件中 `uppercase tracking`（或类似小号大写等宽标签）的实例。如果 count > ceil(sectionCount / 3)，输出失败。
  - **代替 eyebrow 的做法：** 完全去掉它。标题本身就足够了。如果需要对节进行分类，节在页面上的位置已经在分类它；不需要标签。
* **SPLIT-HEADER 禁令（强制）。** "左大标题 + 右小解释段落"作为节标题的模式（左 col-span-7/8，右 col-span-4/5，小正文段落漂浮在右列）**作为默认是被禁止的**。节应该有一个专注的消息。如果你确实需要标题和解释段落，垂直堆叠它们（标题在上，正文在下，max-width 65ch）。仅在有真正的构图原因时才使用 split-header 模式（例如，右列携带视觉或交互元素，而不仅仅是填充文本）。
* **Bento 背景多样性（强制）。** Bento 和功能网格节不能是 6 个带文本的白色白卡。至少 2-3 个单元格在任何多单元格网格中需要有真正的视觉变化：真正的图像、品牌合适的渐变（不是 AI 紫色）、图案、着色背景。仅有排版的米色 bento 阅读起来像无聊的 AI 默认，即使页面的其余部分很好。
* **移动端折叠必须每个节明确声明。** 对于每个多列布局，在同一组件中声明 `< 768px` 的降级方案。不要"它会工作的，Tailwind 会处理"的假设。

### 4.8 图像和视觉资源策略

落地页和作品集是**视觉产品**。仅有文本的页面与假截图 div 是 slop。

**视觉资源优先级顺序：**
1. **首先使用图像生成工具。** 如果环境中有任何图像生成工具（`generate_image`、MCP 图像工具、IDE 集成 gen、OpenAI 图像工具等），你必须使用它来创建节特定的资源：hero 摄影、产品拍摄、纹理背景、氛围图像。以节的正确宽高比生成。不要因为手写 CSS 感觉更快就跳过这一步。
2. **其次使用真实网络图像。** 当没有 gen 工具时，使用真实摄影资源。可接受的默认：
   * `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` 用于占位摄影（seed 应描述节，例如 `marrow-cookware-kitchen`）
   * 当 brief 提供时使用真实库存或品牌 URL
   * 如果明确允许，使用开放许可源（通过直接 URL 的 Unsplash、Pexels）
3. **最后手段：告诉用户。** 如果两者都不可能，**不要**用手动绘制的 SVG 插图或基于 div 的"假截图"填充页面。相反，留下明确标注的占位符槽（`<!-- TODO: hero product photo, 1600x1200 -->`）并在响应末尾说：*"This page needs real images at: \[list of placements\]. Please generate or provide them."*

**即使是极简网站也需要真实图像。** 纯文本页面不是极简主义。是不完整的工作。即使是编辑型 Linear 风格网站也需要至少 2-3 张真实图像（hero、一张产品/生活方式拍摄、一张支持图像）。如果 brief 要求克制的风格，生成 B&W 极简摄影；不要因为刻度盘低就完全跳过图像。

**真实公司 logo 用于社交证明。** 当 brief 要求"Trusted by / Used by / Customers" logo 墙时，**不要默认使用纯文本字标**（`<span>Acme Co</span>` 样式的一行）。使用真实 SVG logo：
* **来源：Simple Icons**（任何颜色的 `https://cdn.simpleicons.org/{slug}/ffffff`，或 `simple-icons` npm 包）。覆盖大多数知名品牌。
* **替代：devicon** 用于技术栈 logo（`@svgr/cli` 或 CDN）。
* **编造的品牌名称？那也编造一个 SVG 标记。** 生成一个简单的字母组合（圆圈中的一个字母、两个字母的连字、抽象字形）渲染为与页面风格匹配的内联 `<svg>`。为虚构品牌名称使用纯文本字标看起来很通用。
* **始终**确保 logo 在浅色和深色模式下都能渲染（暗色上的白色、亮色上的黑色，或单一颜色主题变量）。
* **仅 LOGO 规则（强制）：** logo 墙 = logo，没有其他。不要在每个 logo 下方打印行业/类别标签（`Vercel` + `hosting` 下方没有，`Stripe` + `payments` 下方没有，`Cloudflare` + `infra` 下方没有）。Logo 就是可信度，标签不会增加用户尚不知道的信息。可选：为屏幕阅读器添加品牌名称作为 alt-text，可选链接到品牌网站。就这样。

**手绘插图：**
* 来自库的 SVG 图标：可以（见第 3.C 节）。
* 手绘装饰 SVG（自定义插图、logo、标记）：**强烈不推荐**，绝非默认。仅在以下情况可接受：
  - brief 明确要求（"draw me an SVG logo"）
  - 它是一个简单的几何标记（一个方形、一个圆形、一个用展示字体书写的字标）
  - 你对输出质量有信心

**基于 div 的假截图被禁止。** 用 `<div>` 矩形、假任务列表、假仪表盘、假终端窗口构建的"手工产品预览"是一个 Tell。如果需要展示产品：
* 如果存在，使用真实截图 URL
* 通过图像工具生成一个
* 使用真正的组件预览（页面内部一个真实的 UI 迷你版本）
* 或者完全跳过预览，使用编辑摄影

**Hero 需要真实的视觉。** 文本 + 渐变 blob 不是 hero——是占位符。

### 4.9 内容密度

落地页活在**第一印象**，不是完整阅读。不留情面地削减。

* **每个节的默认内容形态：** 短标题（≤ 8 个词）+ 短子段落（≤ 25 个词）+ 一个视觉资源**或**一个 CTA。任何超出这个的内容必须有充分的节工作理由。
* **无数据转储节。** 20 行发布表格、30 行奖项列表、落地页上的巨大定价矩阵 = 错误的布局。使用：
  - 前 3-5 名亮点 + "查看完整列表"链接
  - Marquee / 轮播展示广度
  - 如果数据是产品，则使用完全不同的页面
* **长列表需要不同的 UI 组件，而不是更长的列表。** 默认 `<ul>` 配合项目符号 / `divide-y` 行是偷懒的选择。如果你有 > 5 个项，使用以下之一：
  - 带分组项的双列分割
  - 每个项带图像 + 标签的卡片网格
  - 如果项可分类则使用标签页 / 手风琴
  - 水平滚动吸附药丸
  - 广度-heavy 列表使用轮播（推荐语、logo、能力）
  - "大量不需要单独注意的东西"使用 marquee
  10 行规范表，每行下方都有 hairline，是**最糟糕的默认**。要么将行分组为 2-3 个稀疏分隔的大块，要么移至每个规范的卡片布局。
* **规范表具体（那种 Marrow-cookware 模式）。** 带 `border-b` 的长产品规范表是 AI 对炊具/硬件/服装/手工商品 brief 的默认。禁止。具体替代方案：
  - **双列卡片网格：** 每个规范有自己的卡片，带规范名称、值（大显示数字）和一行"为什么重要"正文。桌面双列，移动端单列。
  - **滚动吸附水平药丸：** 每个规范是一个药丸，用户可以滑动浏览。
  - **分组块：** 将 10 个规范分组为 3 个逻辑集群（例如"材料"、"烹饪"、"保修"），每个集群获得一个软分隔符和集群标题。
  - **亮点 vs 其余：** 3-4 个英雄规范可视化为大显示磁贴，其余折叠在"查看完整规格"披露下。

* **文案自我审查（发送前强制）：** 在声明任何任务完成之前，重新阅读页面上的每个可见字符串（标题、副标题、eyebrow、按钮标签、正文说明、图注、alt text、页脚文本、错误消息）。标记任何字符串是：
  - **语法破损**（"free on its past"、"two plans but one is honest"、"to put it on the table" out of context）
  - **有不清楚的指代**（"we plan to stay that way" 没有先前上下文）
  - **听起来像 AI 幻觉**（聪明但错误的文字游戏、强制但不成立的比喻、"优雅的空无"短语）
  - **听起来像 LLM 试图显得深思熟虑**（被动-攻击性谦虚、假的工匠标签、模拟诗意的小元数据）
  重写每个被标记的字符串。如果不确定某个字符串是否有意义，用朴素的功能性句子替换它。AI 生成的花哨文案比无聊文案更糟糕。
* **假精确数字被标记。** 像 `92%`、`4.1×`、`48k`、`5.8 mm`、`13.4 lb` 这样的数字要么：
  - 来自真实数据（brief、品牌指南、公共指标）——没问题
  - 明确标注为模拟的（`<!-- mock -->`、"example"、"sample data"）——没问题
  - AI 发明的规范美学——禁止。不要伪造品牌不声称的工程精度。
* **一种文案语气。** 不要在同一个组合中混用技术等宽（"47 tasks · 0.6 ctx-switches/day"）、编辑散文和营销宣言，除非品牌 voice 明确要求。

### 4.10 引语和推荐

* **引语正文最多 3 行。** 永远不要 6 行。如果原始引语更长 → 剪切它。落地页引语是一个片段，不是完整评论。
* 对于很小的字号（例如页脚风格推荐语），行数限制可以略微放宽。精神："一瞥就能容纳"。
* **引语文本内不要使用 em-dash 作为设计装饰**（长停顿、动态 em-dash、em-dash 项目符号）。见第 9.G 节——em-dash 完全被禁止。
* 作者署名：姓名 + 职位 +（可选）公司。绝不只写姓名（"- Sarah"）。
* 引号：使用真实的排版引号（" "）或完全不用。不要用直的 ASCII 引号（"）。

### 4.11 页面主题锁定（浅色/深色模式一致性）

页面有**一种主题**。节不反转。

* 如果页面是深色模式，**所有节都是深色模式**。不要在深色节之间夹入浅色模式暖纸节（反之亦然）。用户不应觉得他们在滚动过程中走进了不同的网站。
* 例外：如果 brief 明确要求"色块故事"或"滚动时主题切换"设备**且**那是一个故意的构图（一次具有强烈过渡的完整主题切换，而不是随机交替），每页允许一次。
* 默认行为：在页面级别选择浅色、深色或自动（`prefers-color-scheme`）并锁定。同一主题族内的节级背景色调是可以的（`bg-zinc-950` 旁边是 `bg-zinc-900`）；在 `bg-zinc-950` 页面中间翻转到 `bg-amber-50` 是破损的。
* 当使用具有内置主题的设计系统时（Radix Themes、shadcn/ui 配合 `<Theme>`），在 `layout.tsx` 或页面根目录设置主题一次。不要让单个节覆盖。

---

## 5. 情境化主动性

这些是工具，不是默认项。在设计研判要求时使用它们。**它们都不会自动触发。**

* **Liquid Glass / Glassmorphism：** 适合高端消费级、Apple 相邻、奢侈品品牌或媒体覆盖氛围。不适合仪表盘、公共部门或"无聊 B2B"。使用时，要超越 `backdrop-filter`：添加 1px 内部边框（`border-white/10`）和微妙的内部阴影（`shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`）用于物理边缘折射。为 `prefers-reduced-transparency` 提供实色降级。
* **磁性微物理：** 当 `MOTION_INTENSITY > 5` **且** brief 是高端/活泼/代理商时使用。仅使用 Motion 的 `useMotionValue` / `useTransform` 在 React 渲染周期之外实现。绝对不要 `useState`。见第 3.B 节。
* **持续微交互**（Pulse、Typewriter、Float、Shimmer、Carousel）：当 `MOTION_INTENSITY > 5` **且** 该节积极受益于动画时使用（状态指示器、实时推送、AI 感）。**不是每个卡片都需要无限循环。** 如果一个节是信息性的，让它保持静止。应用弹簧物理（`type: "spring", stiffness: 100, damping: 20`）——不要线性缓动。
* **"声称有动画，动画就要展示。"** 如果 `MOTION_INTENSITY > 4`，页面必须实际移动：hero 上的进入过渡、关键节的滚动揭示、CTA 上的悬停物理，最低限度。如果无法在可用范围内发送可运行的动画，将刻度盘降至 3 并发送干净的静态页面。永远不要半构建会破坏的动画（切断的 ScrollTrigger、跳动的进入、缺失的清理）。
* **动画必须有动机（强制）。** 在添加任何动画之前问："这个动画传达什么？" 有效答案：层级（将注意力吸引到正确的事物）、讲故事（按匹配叙事的顺序揭示内容）、反馈（确认用户操作）、状态转换（显示某些内容已更改）。无效答案："它看起来很酷"。因为 GSAP 可用就到处用 GSAP 是业余的。每个 ScrollTrigger、每个 marquee、每个固定节都需要一个理由。如果你不能用一句话阐明理由，去掉动画。
* **MARQUEE 每页最多一个（强制）。** 水平滚动文本 marquee（"logo 无限滚动"、"宣言横向滚动"、"动态词条"）每页最多合适一次。两个或更多 marquee 在同一页面上阅读起来像懒惰的填充物。选择 marquee 实际服务内容的那一个节；其他节获得不同的布局。
* **GSAP Sticky-Stack 模式（使用 scroll-stack 时）。** "滚动卡片堆叠"必须是**真正的** sticky-stack，不是顺序揭示列表。见下方第 5.A 节的规范代码骨架。常见失败：触发器在滚动中途而不是在视口顶部固定时触发。修复：`start: "top top"` 而不是 `start: "top center"` 或 `"top 80%"`。
* **GSAP Horizontal-Pan 模式（使用水平滚动劫持时）。** 见下方第 5.B 节的规范骨架。常见失败：动画在该节被固定之前开始，所以用户看到半张幻灯片。相同修复：`start: "top top"`，固定包装器，擦洗内部轨道。

### 5.A Sticky-Stack — 规范骨架

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div
          key={i}
          className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center"
        >
          {card}
        </div>
      ))}
    </div>
  );
}
```

关键点：`start: "top top"`、`pin: true`、除最后一张卡片外每张都被固定，scale/opacity 变换由下一张卡片的滚动触发器驱动。

### 5.B Horizontal-Pan — 规范骨架

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

关键点：`start: "top top"`、`pin: true`、`end: "+=${distance}"`、`scrub: 1`。

### 5.C Scroll-Reveal Stagger — 规范骨架（轻量替代）

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            delay: i * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

### 5.D 禁止的动画模式

* **`window.addEventListener("scroll", ...)`** 被禁止。使用 Motion 的 `useScroll()`、GSAP 的 `ScrollTrigger`、IntersectionObserver 或 CSS `scroll-driven animations`。
* **使用 `window.scrollY` 在 React 状态中计算滚动进度。** 同样原因。每一帧都重新渲染 React 树。
* **触碰 React 状态的 `requestAnimationFrame` 循环。** 使用 motion values（`useMotionValue` + `useTransform`）代替。
* **布局过渡：** 使用 Motion 的 `layout` 和 `layoutId` props 用于可见状态更改。
* **交错编排：** 使用 `staggerChildren`（Motion）或 CSS  cascade。

---

## 6. 性能和可访问性护栏

### 6.A 硬件加速
* **只动画 `transform` 和 `opacity`。** 绝对不要动画 `top`、`left`、`width`、`height`。
* 谨慎使用 `will-change: transform`——仅在实际会动画的元素上使用。

### 6.B 减少动画（强制）
* **任何 `MOTION_INTENSITY > 3` 的动画必须尊重 `prefers-reduced-motion`。** 这是不可妥协的。
* 在 Motion 中：用 `useReducedMotion()` 包装并降级为静态。
* 在 CSS 中：在 `@media (prefers-reduced-motion: no-preference)` 背后设置动画或在 `@media (prefers-reduced-motion: reduce)` 下提供覆盖块。
* 无限循环、视差、滚动劫持和磁性物理在减少动画下必须折叠为静态/即时的。

### 6.C 深色模式（任何面向消费者的页面的强制要求）
* **从一开始就为两种模式设计。** 除非有明确的用户指示，否则不要发送仅浅色或仅深色。
* 使用 Tailwind `dark:` 变体**或** CSS 变量用于 tokens。选择每个项目一个策略。
* **不要在这里规定特定的深色模式颜色。** 由 brief 和品牌决定。此技能只强制：
  * **对比度** - 正文 WCAG AA 最低，hero 副本 AAA 目标。
  * **层级对等** - 在浅色中有效的视觉层级在深色中也必须有效。
  * **品牌忠诚度** - 主品牌颜色保持可识别。
  * **不要使用纯 `#000000` 和纯 `#ffffff`** - 使用近黑和近白。
* 尊重 `prefers-color-scheme: dark`。除非品牌坚持一种模式，否则默认为系统偏好。

### 6.D 核心 Web Vitals 目标
* **LCP** < 2.5s。Hero 图像必须是 `next/image priority` 或预加载。
* **INP** < 200ms。繁重工作移出主线程。
* **CLS** < 0.1。为图像、字体、嵌入物保留空间。
* 在声明页面完成之前运行 Lighthouse。

### 6.E DOM 成本
* 仅在固定的 `pointer-events-none` 伪元素上应用颗粒/噪点滤镜。**绝对不要**在滚动容器上。
* 注意包大小。Motion 不小。Three.js 很大。懒加载任何非 above-the-fold 的内容。

### 6.F Z-Index 约束
**绝对不要**随意使用 `z-50` 或 `z-10`。严格将 z-index 仅用于系统层上下文（粘性导航栏、模态框、覆盖层、颗粒）。

---

## 7. 刻度盘定义（技术参考）

### DESIGN_VARIANCE（1-10 级）
* **1-3（可预测）：** 对称 CSS Grid、相等内边距、居中对齐。
* **4-7（偏移）：** `margin-top: -2rem` 重叠、变化的图像宽高比、左对齐标题居中对齐数据。
* **8-10（不对称）：** 砌体布局、带分数单位的 CSS Grid、巨大空区。
* **移动端覆盖：** 对于 4-10 级，**必须折叠到 < 768px 视口上的严格单列**。

### MOTION_INTENSITY（1-10 级）
* **1-3（静态）：** 无自动动画。仅为 CSS `:hover` 和 `:active` 状态。
* **4-7（流体 CSS）：** `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`。加载入场的 `animation-delay` 级联。
* **8-10（高级编排）：** 复杂的滚动触发揭示、视差、滚动驱动动画。**绝对不要使用 `window.addEventListener('scroll')`**。

### VISUAL_DENSITY（1-10 级）
* **1-3（艺术馆）：** 大量留白。节间距大。
* **4-7（日常应用）：** 标准网络应用间距。
* **8-10（驾驶舱）：** 紧密内边距。无卡片框；1px 线条分隔数据。强制：所有数字使用 `font-mono`。

---

## 8. 深色模式协议

默认双模式。除非 brief 是模拟印刷的编辑型，否则不要假设仅浅色。

### 8.A Token 策略（选择一个并坚持）
* **Tailwind `dark:` 变体**（用于 utility-first 项目的默认）：每个颜色 utility 配对其深色变体。
* **CSS 变量**（用于 shadcn/ui、Radix Themes 或带主题化的组件库）：定义语义 tokens 并在 `[data-theme="dark"]` 或 `@media (prefers-color-scheme: dark)` 下交换值。

### 8.B 不要在这里规定特定颜色
由 brief 和品牌决定。此技能只强制：
* **对比度** - 正文 WCAG AA 最低，hero 副本 AAA 目标。
* **层级对等** - 在浅色中有效的视觉层级在深色中也必须有效。
* **品牌忠诚度** - 主品牌颜色保持可识别。
* **不要使用纯 `#000000` 和纯 `#ffffff`** - 使用近黑和近白。

### 8.C 默认模式
尊重 `prefers-color-scheme` 除非品牌坚持。添加手动切换以防任一模式会失去关键品牌表达。

### 8.D 在两种模式下测试后再完成
在开发过程中在两种模式下打开页面。不要只在一个模式下看到就发送。

---

## 9. AI TELLS（禁止模式）

避免这些特征，除非 brief 明确要求。

### 9.A 视觉和 CSS
* **默认不要使用霓虹/外发光。** 使用内部边框或微妙的着色阴影。
* **不要使用纯黑（`#000000`）。** 近黑、zinc-950 或炭灰。
* **不要使用过度饱和的 accent。** 脱饱和以与中性色混合。
* **不要使用过度渐变文本** 用于大标题。
* **不要使用自定义鼠标光标。** 过时、无障碍不友好、性能不友好。

### 9.B 字体排版
* **默认避免 Inter。** 见第 4.1 节。存在覆盖路径。
* **不要使用过大的 H1 嘶吼。** 用粗细 + 颜色控制层级，而非原始比例。
* **衬线约束：** 衬线用于编辑型/奢侈品/出版。不是仪表盘。

### 9.C 布局和间距
* **数学上完美的** 内边距和外边距。没有带尴尬间隙的浮动元素。
* **不要使用 3 列等宽功能卡片。** 使用 2 列 zigzag、不对称网格、滚动固定或水平滚动替代。

### 9.D 内容和数据（"Jane Doe"效应）
* **不要使用通用名称。** "John Doe"、"Sarah Chan"、"Jack Su" → 使用有创意、真实、符合语言环境的名称。
* **不要使用通用头像。** 没有 SVG"蛋"或 Lucide 用户图标 → 使用可信的照片占位符。
* **不要使用假完美数字。** 避免 `99.99%`、`50%`、`1234567`。使用有机的、凌乱的数据。
* **不要使用创业 slop 品牌名称。** "Acme"、"Nexus"、"SmartFlow"、"Cloudly" → 发明听起来真实的有语境的高级名称。
* **不要使用填充动词。** "Elevate"、"Seamless"、"Unleash"、"Next-Gen"、"Revolutionize" → 仅使用具体动词。

### 9.E 外部资源和组件
* **不要手写 SVG 图标。** 使用 Phosphor / HugeIcons / Radix / Tabler。仅在明确请求时使用 Lucide。
* **不要使用基于 div 的假截图。** 永远不要用 `<div>` 矩形构建假产品 UI 来模拟截图。
* **不要使用失效的 Unsplash 链接。** 使用 `https://picsum.photos/seed/{descriptive-string}/{w}/{h}`。
* **shadcn/ui 定制：** 允许，但**绝不**处于默认状态。

### 9.F 生产测试 Tells（直接禁止）

这些模式来自真实的 LLM 生成落地页测试。将它们视为硬性禁止，除非 brief 明确要求其中一个。

**Hero 和页面顶部**
* **不要在 hero 中使用版本标签。** `V0.6`、`v2.0`、`BETA`、`INVITE-ONLY PREVIEW`、`EARLY ACCESS`、`ALPHA` - 作为默认 eyebrow 被禁止。
* **不要使用"Brand · No. 01"风格的 sub-eyebrows。**

**节编号和微标签**
* **不要使用节编号 eyebrow。** `00 / INDEX`、`001 · Capabilities`、`002 · Featured commission` - 禁止。
* **不要使用图像或 bento 磁贴上的 `01 / 4` 样式分页。**
* **不要使用 `Scroll · 001 Capabilities` 样式滚动提示。**

**分隔符和点**
* **中点（`·`）限量使用。** 元数据条中每行最多 1 个。
* **不要在每个列表/nav/badge 上使用装饰性彩色状态点。**

**Em-dash 和字体装饰**
* **不要使用 em-dash（`—`）作为设计元素或任何其他地方。** 见第 9.G 节。
* **不要将 `<br>` 断开和斜体化的标题作为默认"设计动作"。**
* **不要使用垂直旋转文本。** 代理商作品集陈词滥调。
* **不要使用十字线/发丝网格线作为装饰。**

**假产品预览**
* **不要在 hero 中使用基于 div 的假产品 UI**（假任务列表、假终端、假仪表盘由样式化 div 构建）。
* **不要在假截图中使用假版本脚注**（"v0.6.2-rc.1"、"last sync 4s ago · main"）。

**营销文案 Tells**
* **不要使用"Quietly in use at" / "Quietly trusted by"** 社交证明标题。使用自然语言。
* **不要使用"From the field" / "Field notes" / "Currently on the bench" / "On our desks" / "Loose plates"** 风格诗意标签。
* **不要使用"我们尊重法国人"风格的** 模拟谦逊行业引用在正文说明中。
* **不要在标题/页脚使用天气/区域条**（"LIS 14:23 · 18°C"）除非 brief 明确关于某个地方。
* **不要在 eyebrow 下使用微元句子。**
* **不要使用通用步骤标签。** "Stage 1 / Stage 2 / Stage 3" - 禁止。直接使用动词-名词（"Install"、"Configure"、"Ship"）。

**药丸、标签和版本戳**
* **不要在图像上覆盖药丸/标签/标签。**
* **不要使用照片信用图注作为装饰。**（`Field study no. 12 · Ines Caetano`）
* **不要在营销页面上使用版本脚注。**（`v1.4.2`、`Build 0048`）
* **不要使用"Reservation 412 of 800"风格的** 实时库存计数器作为装饰。

**装饰文本条**
* **不要在 hero 底部使用装饰文本条。**（`BRAND. MOTION. SPATIAL.`）
* **不要在节标题中使用浮动右上角子文本。**

**列表、分隔符和评分**
* **不要在长列表/规范表的每一行使用 `border-t` + `border-b`。**
* **不要使用带填充背景轨道的评分/进度条** 作为比较视觉。

**区域、时间、滚动提示**
* **不要使用区域/城市名称/时间/天气条** 除非 brief 真正是全球分布的或地点聚焦的。
* **不要使用滚动提示。** `Scroll`、`↓ scroll`、`Scroll to explore` - 禁止。
* **默认零装饰状态点。**

### 9.G EM-DASH 禁令（违反最多的 Tell）

**Em-dash（`—`）完全被禁止。** 它是 LLM 的签名风格拐杖，是生产测试中的 #1 视觉 Tell。没有"限制使用"的余地。

* **在标题中禁止。** 使用句号或逗号。
* **在 eyebrow / 标签 / 药丸 / 按钮文本 / 图像图注 / nav 项中禁止。** 用换行符、列或发丝线替换。
* **在正文说明中禁止。** 重组句子：两个带句号的句子，**或**逗号，**或**括号，**或**冒号。
* **在引语归属中禁止。** 使用带空格的正常连字符（` - `）或换行符。
* **连字符形式（`–`）作为分隔符时也禁止。** 日期范围（`2018-2026`）使用连字符。

页面上唯一允许的破折号字符是：
* 常规连字符 `-`（用于复合词、范围、标记中的线条分隔符）
* 数学中的减号（`-5°C`）

如果你的输出中任何可见的地方出现单个 `—` 或 `–`，输出就未通过 Pre-Flight Check，必须重写。

此规则不可妥协。

---

## 10. 参考词汇（代理应知道的模式名称）

这是词汇表，不是库。代理应该了解这些模式名称，以便交流、用它们设计，以及在设计研判要求时使用它们。

### Hero 范例
* **不对称分割 Hero** - 文本在一侧，资源在另一侧，充裕留白。
* **编辑宣言 Hero** - 大字体，无资源，几乎像海报。
* **视频/媒体遮罩 Hero** - 类型作为遮罩切入视频背景。
* **动态字体 Hero** - 动画排版作为主要视觉。
* **幕布揭示 Hero** - Hero 部分像幕布一样在滚动中揭开。
* **滚动固定 Hero** - Hero 保持固定而内容在后面滚动。

### 导航和菜单
* **Mac OS Dock 放大** - 边缘导航，图标在悬停时平滑缩放。
* **磁性按钮** - 向光标拉动。
* **粘性菜单** - 子项像粘性液体一样分离。
* **Dynamic Island** - 用于状态/警报的变形药丸。
* **上下文径向菜单** - 在点击点展开的圆形菜单。
* **浮动速度拨盘** - FAB 弹入弯曲的次要操作。
* **Mega 菜单揭示** - 全屏下拉，stagger-fade 内容。

### 布局和网格
* **Bento Grid** - 不对称磁贴分组（Apple 控制中心）。
* **砌体布局** - 不固定行高的交错网格。
* **Chroma Grid** - 带微妙动画渐变的边框/磁贴。
* **分屏滚动** - 两半向相反方向滑动。
* **Sticky-Stack Sections** - 在滚动中固定和堆叠的节。

### 卡片和容器
* **视差倾斜卡片** - 3D 倾斜追踪鼠标坐标。
* **聚光灯边框卡片** - 边框在光标下照亮。
* **Glassmorphism 面板** - 带内部折射的磨砂玻璃。
* **全息箔卡片** - 悬停时彩虹色偏移。
* **Tinder 滑动堆叠** - 物理卡片堆叠，滑动离开。
* **变形模态** - 按钮扩展成自己的对话框。

### 滚动动画
* **Sticky Scroll Stack** - 卡片固定并物理堆叠。
* **水平滚动劫持** - 垂直滚动 → 水平平移。
* **Locomotive / Sequence Scroll** - 视频/3D 序列绑定到滚动条。
* **缩放视差** - 中央背景图像在滚动时放大。
* **滚动进度路径** - 沿滚动绘制的 SVG 线条。
* **Liquid Swipe 过渡** - 像粘性液体一样的页面过渡。

### 画廊和媒体
* **Dome Gallery** - 3D 全景画廊。
* **Coverflow Carousel** - 带 angled 边缘的 3D 轮播。
* **拖动平移网格** - 无边界的可拖动画布。
* **手风琴图像滑块** - 悬停时扩展的窄条。
* **悬停图像轨迹** - 鼠标离开时留下的弹出图像。
* **故障效果图像** - 悬停时 RGB 通道偏移。

### 字体排版和文本
* **动态 Marquee** - 滚动时反向的无限文本带。
* **文本遮罩揭示** - 作为视频透明窗口的巨型类型。
* **文本扰码效果** - 加载/悬停时矩阵风格解码。
* **圆形文本路径** - 文本沿旋转圆形弯曲。
* **渐变描边动画** - 带运行渐变的轮廓文本。
* **动态排版网格** - 字母躲避光标。

### 微交互和效果
* **粒子爆炸按钮** - CTA 成功时碎裂成粒子。
* **Liquid Pull-to-Refresh** - 像分离液滴一样的重新加载指示器。
* **骨架闪烁** - 跨占位符移动的光反射。
* **方向悬停感知按钮** - 填充从光标确切一侧进入。
* **涟漪点击效果** - 从点击坐标开始的波浪。
* **动画 SVG 线条绘制** - 向量实时自我绘制。
* **网格渐变背景** - 有机熔岩灯 blob。
* **镜头模糊景深** - 背景 UI 模糊以聚焦前景动作。

### 动画库选择
* **Motion（`motion/react`）** - UI / Bento / 状态变化动画的默认。
* **GSAP + ScrollTrigger** - 用于全页滚动讲述和滚动劫持。隔离在专用叶组件中。
* **Three.js / WebGL** - 用于画布背景和 3D 场景。相同的隔离规则。
* **绝对不要在同一个组件树中混用 GSAP / Three.js 和 Motion。**

---

## 11. 重新设计协议

此技能处理**新项目构建和重新设计**。错误分类模式是糟糕重新设计输出的最大来源。

### 11.A 检测模式（第一个动作）
* **新项目** - 没有现有站点，或已批准全面改造。根据第 1 节从基线设置刻度盘。
* **重新设计 - 保留** - 现代化而不破坏品牌。先审计，提取品牌 tokens，逐步演进。
* **重新设计 - 全面改造** - 在现有内容之上使用新的视觉语言。视觉上当作新项目；保留内容和 IA。

如果模糊，问**一次**：*"Should this redesign preserve the existing brand, or are we starting visually from scratch?"*

### 11.B 动手前先审计
在提出更改之前记录当前状态：
* **品牌 tokens** - 主/强调颜色、字体堆栈、logo 处理、圆角。
* **信息架构** - 页面树、主导航、关键转化路径。
* **内容块** - 存在什么，什么在工作，什么是填充物。
* **保留的模式** - 签名交互、可识别的 hero、copy voice。
* **淘汰的模式** - AI slop tells、破损布局、死链接、通用库存图像、性能陷阱。
* **现有站点的刻度盘读数** - 推断当前的 `DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`。
* **SEO 基线** - 当前排名页面、元标题、结构化数据、OG 卡片。**SEO 迁移是 #1 重新设计风险。**

### 11.C 保留规则
* **不要更改信息架构** 除非被要求。
* **在应用第 4.2 节之前提取品牌颜色。** 已经是紫色的品牌保持紫色。
* **保留 copy voice** 除非被要求重写。
* **尊重现有的无障碍胜利。** 不要退化焦点状态、alt text、键盘导航、对比度。
* **尊重现有分析事件。** 不要重命名按钮、表单字段、节 ID。

### 11.D 现代化杠杆（优先级顺序）
按顺序应用——满足 brief 时停止：
1. **字体排版刷新** - 每单位风险最大的视觉提升。
2. **间距和节奏** - 增加节内边距，修复垂直节奏。
3. **颜色重新校准** - 脱饱和、统一中性色、保持品牌 accent。
4. **动画层** - 添加 `MOTION_INTENSITY` 适当的微交互。
5. **Hero 和关键节重组** - 使用第 10 节词汇重组漏斗顶部。
6. **完整块替换** - 仅在现有块不可挽救时才替换。

### 11.E 决策树：针对性演进 vs 全面重新设计
* IA、内容和 SEO 听起来不错 → **针对性演进**（杠杆 1-4）。约 70% 的价值在约 40% 的风险下。
* 视觉债务是结构性的 → **全面重新设计**，严格保留内容。
* 品牌本身在变化 → **新项目**。

### 11.F 永远不要悄悄更改
未经明确用户批准绝不修改：
* URL 结构/路由 slug。
* 主导航标签。
* 表单字段名称或顺序。
* 品牌 logo 或字标。
* 现有法律/同意/cookie copy。

---

## 12. 块库（契约——实现将迭代落地于此）

参考词汇（第 10 节）命名模式。块库用真实 props、真实动画规格和真实代码草图实现它们。

### 12.A 文件位置
```
skills/taste-skill/blocks/
  hero/
  feature/
  social-proof/
  pricing/
  cta/
  footer/
  navigation/
  portfolio/
  transition/
```

### 12.B 必需的 frontmatter
```yaml
---
name: asymmetric-split-hero
category: hero
dial_compatibility:
  variance: [6, 10]
  motion: [3, 10]
  density: [2, 5]
when_to_use: "Landing pages with one strong asset and one strong message."
not_for: "Editorial / manifesto launches where the message IS the design."
stack: ["react", "next", "tailwind", "motion"]
---
```

### 12.C 必需的正文节
1. **视觉草图** - 简短 ASCII 或布局描述。
2. **Props API** - 组件的接口。
3. **代码草图** - 最少可行实现。
4. **移动端降级** - `< 768px` 的明确折叠规则。
5. **动画变体** - 每个 `MOTION_INTENSITY` 波段一个变体。
6. **深色模式说明** - 此块特有的 token 策略。
7. **反模式** - 此块常见的错误方式。
8. **参考** - 生产中真实示例的链接。

### 12.D 块库纪律
* 一个文件一个块。没有多块文件。
* 每个块必须独立工作（放入页面就渲染）。
* 每个块必须通过 Pre-Flight Check（第 14 节）。

---

## 13. 超出范围

此技能**不适用于**：
* 仪表盘/密集产品 UI / 管理面板（使用第 2.A 节的 Fluent、Carbon、Atlassian 或 Polaris）。
* 数据表格（使用 TanStack Table 或 AG Grid）。
* 多步表单/向导。
* 代码编辑器（使用 Monaco / CodeMirror 及其官方皮肤）。
* 原生移动端（直接使用 Apple HIG / Material）。
* 实时协作 UI（存在、光标、OT 感知——不同的问题类）。

---

## 14. 最终 Pre-Flight Check

输出代码前运行此矩阵。**这不是可选的。运行每个框。如果任何框失败，输出就没完成。**

- [ ] **Brief 推断** 已声明（第 0.B 一行）？
- [ ] **刻度盘值** 明确且根据 brief 推理，不是静默使用基线？
- [ ] **设计系统** 从第 2 节选择（如果适用），或诚实标注审美？
- [ ] **重新设计模式** 已检测并已审计（如适用，第 11 节）？
- [ ] **零 em-dashes（`—`）** 在页面上的任何地方？（第 9.G 节——不可妥协。）
- [ ] **页面主题锁定**：整个页面一种主题。没有节反转。
- [ ] **颜色一致性锁定**：一种 accent 颜色在所有节中使用相同。
- [ ] **形状一致性锁定**：一种圆角系统应用一致。
- [ ] **按钮对比度检查**：每个 CTA 文本可读（WCAG AA 4.5:1）？
- [ ] **CTA 按钮换行**：没有 CTA 标签在桌面端换行成 2+ 行？
- [ ] **表单对比度检查**：表单输入全部通过 WCAG AA？
- [ ] **衬线纪律**：如果使用衬线，不是 Fraunces 或 Instrument_Serif？
- [ ] **高端消费级调色板检查**：不是米色+黄铜+绛红+浓咖啡家族？
- [ ] **斜体降部间隙**：每个斜体降部单词有 `leading-[1.1]` + `pb-1`？
- [ ] **Hero 适配视口**：标题 ≤ 2 行，子文本 ≤ 20 个词，CTA 无需滚动可见？
- [ ] **Hero 顶部内边距**：桌面最多 `pt-24`？
- [ ] **Hero 堆叠纪律**：最多 4 个文本元素？
- [ ] **EYEBROW 计数（机械）**：count ≤ ceil(sectionCount / 3)？
- [ ] **Split-Header 禁令**：没有"左大标题 + 右小解释段落"模式？
- [ ] **Zigzag 交替上限**：没有 3+ 个连续图像+文本分割节？
- [ ] **无重复 CTA 意图**：页面上没有两个意图相同的 CTA？
- [ ] **Logo 墙 = 仅 logo**：logo 下方没有行业标签？
- [ ] **Bento 背景多样性**：至少 2-3 个单元格有视觉变化？
- [ ] **"Used by / Trusted by" logo 墙** 位于 Hero 下方，不在内部？
- [ ] **文案自我审查**：每个可见字符串已重新阅读，没有 AI 幻觉短语？
- [ ] **动画有动机**：每个动画都用一句话证明正当性？
- [ ] **Marquee 最多每页一个**：没有两个水平 marquee？
- [ ] **导航在桌面单行**，高度 ≤ 80px？
- [ ] **节布局重复** 检查：8 节至少有 4 种不同的族？
- [ ] **Bento 有精确单元格计数**（N 项 → N 个单元格，没有空单元格）？
- [ ] **长列表使用正确的 UI 组件**（> 5 项不用默认 `<ul>`）？
- [ ] **使用真实图像** ——没有基于 div 的假截图？
- [ ] **没有药丸/标签叠加在图像上**？
- [ ] **没有照片信用图注作为装饰**？
- [ ] **没有版本脚注**（`v1.4.2`、`Build 0048`）在营销页面上？
- [ ] **没有滚动提示**（`Scroll`、`↓ scroll`）？
- [ ] **Hero 中没有版本标签** 除非 brief 是发布？
- [ ] **零装饰状态点**（默认没有，仅用于真实语义状态）？
- [ ] **长列表每行没有 `border-t` + `border-b`**？
- [ ] **内容密度合理**：没有 20 行数据表，子段落 ≤ 25 个词？
- [ ] **引语 ≤ 3 行** 正文，归属清晰（无 em-dash）？
- [ ] **声称有动画 = 动画展示**：如果 `MOTION_INTENSITY > 4`，页面实际动画？
- [ ] **GSAP sticky-stack / horizontal-pan** 按规范骨架实现？
- [ ] **没有 `window.addEventListener('scroll')`**？
- [ ] **减少动画** 为所有 `MOTION_INTENSITY > 3` 包装？
- [ ] **深色模式** tokens 定义并在两种模式下测试？
- [ ] **移动端折叠** 为高方差布局明确声明？
- [ ] **视口稳定性**：`min-h-[100dvh]`，绝不是 `h-screen`？
- [ ] **`useEffect` 动画** 有严格的清理函数？
- [ ] **空/加载/错误** 状态已提供？
- [ ] **在可能的情况下省略卡片** 而使用间距？
- [ ] **图标** 仅来自允许的库（Phosphor / HugeIcons / Radix / Tabler）？
- [ ] **没有 AI Tells** 来自第 9 节？
- [ ] **核心 Web Vitals** 可信地达到（LCP < 2.5s，INP < 200ms，CLS < 0.1）？
- [ ] **一个设计系统** 每个项目（不混合 Material + shadcn）？

---

## 附录 A — 每个设计系统的安装命令

```bash
# Material Web (Material 3)
npm install @material/web

# Fluent UI React (v9)
npm install @fluentui/react-components

# Fluent UI Web Components (framework-free)
npm install @fluentui/web-components @fluentui/tokens

# IBM Carbon
npm install @carbon/react @carbon/styles

# Radix Themes
npm install @radix-ui/themes

# shadcn/ui (open code, owned components)
npx shadcn@latest init
npx shadcn@latest add button card badge separator input

# Primer CSS (GitHub product/devtool UI)
npm install --save @primer/css

# Primer Brand (GitHub marketing UI)
npm install @primer/react-brand

# GOV.UK Frontend
npm install govuk-frontend

# USWDS (US Web Design System)
npm install uswds

# Atlassian Design System (Atlaskit)
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge @atlaskit/section-message @atlaskit/card

# Bootstrap 5.3
npm install bootstrap
```

## 附录 B — Apple Liquid Glass：诚实的 Web 近似

**不要**将随机 CSS 片段当作官方的 Apple Liquid Glass。正常的网站没有来自 Apple 的官方 `liquid-glass.css`。

Web 近似可以使用：
- `backdrop-filter`
- 透明背景
- 分层边框
- 高光叠加
- 渐变
- 动画
- 强烈的对比度降级

但那是**网络 glassmorphism / 磨砂玻璃近似**，不是官方的 Apple Liquid Glass。在注释中标注为近似。

```css
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / .32);
  background:
    linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)),
    rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .48),
    inset 0 -1px 0 rgb(255 255 255 / .12),
    0 18px 60px rgb(0 0 0 / .18);
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / .18);
    background:
      linear-gradient(135deg, rgb(255 255 255 / .16), rgb(255 255 255 / .04)),
      rgb(15 23 42 / .42);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / .22),
      0 18px 60px rgb(0 0 0 / .42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / .96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

**重要：** `prefers-reduced-transparency` 浏览器支持不均匀；测试它。即使没有模糊也要始终提供足够的对比度。