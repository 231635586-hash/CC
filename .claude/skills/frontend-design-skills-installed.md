---
name: frontend-design-skills-installed
description: 已安装的两个前端设计技能：impeccable-skill（含37个参考文件）和 taste-skill（Anti-slop规范）
metadata:
  type: project
  originSessionId: 9fb61e6b-364e-419a-8ddf-757c4e273dde
---

# 已安装的前端设计 Skills

## Skills 目录索引
- **路径**: `.claude/skills/SKILL.md`
- **内容**: 所有已安装技能的统一入口，含 taste-skill、impeccable-skill、product-rd-manager-role

---

## 1. impeccable-skill（高保真前端设计技能）

**来源**: [watchi666/impeccable_claude_code](https://github.com/watchi666/impeccable_claude_code) (Apache 2.0, v3.5.0)

**路径**: `.claude/skills/impeccable-skill/SKILL.md` + 37个 reference 文件

**核心机制**:
- **双注册系统**: Brand（设计即产品）vs Product（设计服务于产品）
- **命令体系**: craft/shape/critique/audit/polish/bolder/quieter/distill/harden/onboard/animate/colorize/typeset/layout/delight/overdrive/clarify/adapt/optimize/live 等
- **OKLCH 色彩**: 感知均匀的颜色空间，WCAG AA/AAA 合规
- **Nielsen 10 启发式评分**: 0-40 分量表
- **14 步 Pre-Flight Check**: 多维度质量检查

**主要参考文件**:
- `craft.md` — 端到端构建流程（Shape → 视觉方向 → 代码 → 浏览器检查）
- `shape.md` — 设计简报流程（发现访谈 + 视觉方向探索）
- `critique.md` — UX 评审工作流（双评估 + Nielsen 评分）
- `audit.md` — 技术质量审计（可访问性/性能/主题化/响应式/代码质量）
- `brand.md` / `product.md` — 双注册类型的设计规范
- `color-and-contrast.md` — OKLCH 色彩系统详解
- `heuristics-scoring.md` — Nielsen 评分量表
- `cognitive-load.md` — 认知负荷规则（≤4 工作记忆原则）
- `interaction-design.md` — 八种交互状态设计

**使用方式**: `/impeccable` 或 `/impeccable <command>`

---

## 2. taste-skill（Anti-slop 前端设计规范）

**来源**: [Leonxlnx/taste-skill](https://github.com/watchi666/impeccable_claude_code) (Apache 2.0, v3.5.0)

**路径**: `.claude/skills/taste-skill/SKILL.md`

**核心机制**:
- **3 刻度盘系统**: DESIGN_VARIANCE(1-10) / MOTION_INTENSITY(1-10) / VISUAL_DENSITY(1-10)
- **14 步 Pre-Flight Check**: Zero em-dash、Hero 首屏可见、Eyebrow≤1/3sections 等
- **GSAP 规范代码骨架**: Sticky-Stack / Horizontal-Pan 模式
- **Em-dash 禁令**: 完全禁止，违反即 Pre-Flight Fail

**定位**: Anti-slop 落地页/作品集设计规范，专为落地页、作品集、重新设计而生。不做后台/仪表盘/数据表格。

**使用方式**: `/skill taste-skill`

---

## 3. product-rd-manager-role（产品研发经理角色）

**路径**: `~/.claude/projects/-Users-roro-Vibe-coding/memory/product-rd-manager-role.md`

**核心机制**:
- **5 步固定执行顺序**: 需求补全 → 流程设计(Mermaid) → 代码实现 → 成本评估 → 落地自检
- **三大强制准则**: 产品体验管控、原型等价于可运行代码、研发落地风险兜底
- **自检清单**: 交互时效、边界覆盖、代码可运行、成本量化、权限审计

**使用方式**: 参考此角色规范进行产品/需求类任务

---

## 4. pptx-skill（PPTX 创建/编辑技能）

**来源**: [inprealpha/claude-pptx-skill](https://github.com/inprealpha/claude-pptx-skill) (Fork of Anthropic PPTX skill, Proprietary)

**路径**: `.claude/skills/pptx-skill/SKILL.md` + editing.md + pptxgenjs.md + structured.md + scripts/

**核心模式**:
- **Structured / Analytical**（默认）: 董事会、投资者更新、策略审查、政策简报、咨询交付物、内部评审
- **Visual / Narrative**: 创业路演、营销演示、产品发布、活动 Deck

**子参考文件**:
- `editing.md` — 模板编辑工作流（解包 → 操作 → 编辑 → 清理 → 打包）
- `pptxgenjs.md` — 从零创建 PPTX（使用 pptxgenjs 库）
- `structured.md` — 结构化论证模式
  - Ghost deck test: Action Titles alone must form coherent argument
  - Action Title: 完整句子陈述结论，非主题标签
  - One exhibit per slide with clear "so what"

**脚本工具**:
- `scripts/thumbnail.py` — 生成视觉缩略图
- `scripts/office/unpack.py` — 解包 PPTX 为 XML

**使用方式**: `/pptx` 或当用户提到 "deck"、"slides"、"presentation"、.pptx 文件时

---

## Skills 安装记录

| 时间 | 操作 | 路径 |
|------|------|------|
| 2026/06/05 | 安装 taste-skill（英文原版） | `.claude/skills/taste-skill/SKILL.md` |
| 2026/06/05 | taste-skill 添加中文注释 | `.claude/skills/taste-skill/SKILL.md` |
| 2026/06/05 | 安装 impeccable-skill（英文原版） | `.claude/skills/impeccable-skill/SKILL.md` + 37个 reference |
| 2026/06/05 | impeccable-skill 所有文件添加中文注释 | `.claude/skills/impeccable-skill/SKILL.md` + 所有 reference/*.md |
| 2026/06/05 | 安装 pptx-skill（Fork of Anthropic） | `.claude/skills/pptx-skill/SKILL.md` + editing.md + pptxgenjs.md + structured.md |

**Why:** 统一管理项目已安装的所有 Claude Code 技能，方便后续使用时快速查阅。
**How to apply:** 任何前端设计任务优先查阅这两个 skill；产品/需求任务参考 product-rd-manager-role。