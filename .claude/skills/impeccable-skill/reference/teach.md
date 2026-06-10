# Teach Flow：设计上下文设置

为项目收集战略和视觉设计上下文的结构化访谈流程。产生两个基础文件：

1. **PRODUCT.md** — 战略答案（谁/什么/为什么）：register、用户、目的、品牌个性、反参考、设计原则、无障碍
2. **DESIGN.md** — 视觉答案（它如何看起来）：颜色、字体排版、组件、布局

---

## 流程（6 步）

**第 1 步：加载状态**

检查哪些文件已经存在并遵循决策树：
- 两个文件都没有 → 执行第 2–4 步，然后决定 DESIGN.md
- PRODUCT.md 存在，DESIGN.md 缺失 → 跳到第 5 步
- 两个都存在 → 问用户要刷新哪个
- 仅有 DESIGN.md → 首先创建 PRODUCT.md

**绝不要静默覆盖现有文件。**

**第 2 步：探索代码库**

扫描 README、package.json、组件、品牌资产、设计 tokens、样式指南。形成"register 假设"（brand vs. product）。注意你学到了什么，什么仍然不清楚。

**第 3 步：问战略问题**

使用访谈模式，而不是确认模式。每轮问 2–3 个问题，**等待答案**。覆盖：register、用户/目的、品牌个性、反参考、无障碍。

在起草 PRODUCT.md 之前至少需要一轮真实的用户答案。

**第 4 步：写入 PRODUCT.md**

仅在用户确认战略答案后。结构：
- Register（brand 或 product）
- Users
- Product Purpose
- Brand Personality
- Anti-references
- Design Principles（3–5 个战略规则，不是视觉的）
- Accessibility & Inclusion

**第 5 步：决定 DESIGN.md**

提供 `/impeccable document`。如果存在代码，捕获视觉系统。如果预实现，播种起始答案。用户可以稍后重新运行。

**第 6 步：总结和刷新上下文**

总结所写的内容和指导原则。重新运行加载器，以便后续命令使用新鲜的 PRODUCT.md。恢复任何阻止的 impeccable 命令（例如 `/impeccable craft`）并加载上下文。

---

## 关键原则

绝不要仅从任务提示综合 PRODUCT.md。先访谈，确认答案，然后写。