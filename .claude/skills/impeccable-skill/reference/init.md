# Init Flow（初始化流程）

通过三个核心产物建立项目上下文的设置命令：

1. **PRODUCT.md** — 战略基础：register（brand vs. product）、用户、目的、个性、反参考、设计原则、无障碍。
2. **DESIGN.md** — 视觉系统：主题、颜色、字体排版、组件、布局（Google Stitch 标准）。
3. **Live Mode Config** — 预配置的 `.impeccable/live/config.json` 用于变体生成。

---

## 核心流程

**第 1 步**：加载现有文件。
**第 2 步**：执行一次彻底的代码库 crawl 以提供所有下游工作。
**第 3 步**：结构化访谈（每轮 2–3 个问题）以确认 register 和战略方向。
**第 4 步**：在用户确认后将答案综合到 PRODUCT.md。
**第 5 步**：提供 `/impeccable document` 以生成或更新 DESIGN.md。
**第 6 步**：如果存在代码，预配置 live 模式，包括 CSP 检测。
**第 7 步**：根据 crawl 发现的内容推荐下一个命令。

---

## 关键原则

绝不要静默覆盖现有文件。始终先确认。如果 PRODUCT.md 和 DESIGN.md 都存在，停止并询问要刷新哪个（如果有的话）。