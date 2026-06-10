# DESIGN.md 生成参考

创建 `DESIGN.md` 文件，捕获项目的视觉设计系统，使 AI 代理能够生成符合品牌的屏幕。

---

## 核心结构

1. **YAML frontmatter**：机器可读的设计 tokens（颜色、字体排版、圆角、间距、组件）
2. **Markdown 正文**：固定顺序的六个部分：概述、颜色、字体排版、海拔、组件、注意事项

## Token Schema 规则

- **颜色格式**：仅十六进制 sRGB（`#RGB`、`#RRGGBB`）
- **Token 引用**：使用 `{path.to.token}` 语法（例如 `{colors.primary}`）
- **组件属性**：限于 8 个 props — `backgroundColor`、`textColor`、`typography`、`rounded`、`padding`、`size`、`height`、`width`

---

## 两种工作流程

**Scan Mode**（默认）：从现有代码提取 tokens，自动构建 frontmatter，写入完整的 DESIGN.md。

**Seed Mode**：用于预实现项目。进行五问题访谈，产生标记为 `<!-- SEED -->` 的最少的脚手架。

---

## Scan Mode 步骤

1. 在 CSS 自定义属性、Tailwind 配置、CSS-in-JS 主题文件中搜索 tokens
2. 自动提取和组织：按角色分组颜色（主要/次要/第三/中性）
3. 征求创意输入：北极星隐喻、概述 voice、颜色描述性名称
4. 用 frontmatter 和六个 markdown 部分写入 DESIGN.md
5. 写入 `.impeccable/design.json` sidecar 用于扩展数据
6. 与用户确认

---

## 注意事项指南

- 使用强制性语言："禁止"、"不允许"、"永远不"、"总是"——不是"考虑"或"更喜欢"
- 在 Don'ts 中按名称引用反参考
- 在括号中提供带确切值的具体审计测试

---

## 关键约束

- 绝不重新排序或重命名六个部分
- 不要在 frontmatter 和 prose 之间重复 token 值
- 不要静默覆盖现有 DESIGN.md——先问用户