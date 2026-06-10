---
name: skills-directory
description: Claude Code 技能目录 - 项目已安装的所有技能索引
metadata:
  type: reference
---

# Skills 目录

> 本目录整理当前项目已安装/配置的所有 Claude Code 技能。

---

## 已安装技能

| 技能名称 | 类型 | 路径 | 说明 |
| ------- | ---- | ---- | ---- |
| [pptx-skill](#pptx-skill) | 文档生成 | `.claude/skills/pptx-skill/SKILL.md` | PPTX 创建/编辑技能，支持 Structured Argument 模式 |
| [impeccable-skill](#impeccable-skill) | 前端设计 | `.claude/skills/impeccable-skill/SKILL.md` | 高保真前端设计技能，含 craft/shape/critique 等 35+ 命令 |
| [taste-skill](#taste-skill) | 前端设计 | `.claude/skills/taste-skill/SKILL.md` | Anti-slop 落地页/作品集设计规范 |
| [product-rd-manager-role](#product-rd-manager-role) | 角色规范 | `~/.claude/projects/*/memory/product-rd-manager-role.md` | 产品研发经理角色定义 |

---

## 技能详情

### pptx-skill

**类型**: 文档生成
**路径**: `.claude/skills/pptx-skill/SKILL.md`
**来源**: [inprealpha/claude-pptx-skill](https://github.com/inprealpha/claude-pptx-skill) (Fork of Anthropic PPTX skill, Proprietary)

**定位**: 处理任何涉及 .pptx 文件的任务——创建幻灯片、读取/解析内容、编辑/修改现有演示文稿、合并或拆分文件。

**核心模式**:
- **Structured / Analytical**（默认）: 董事会、投资者更新、策略审查、政策简报、咨询交付物、内部评审
- **Visual / Narrative**: 创业路演、营销演示、产品发布、活动 Deck

**子参考文件**:
- `editing.md` — 模板编辑工作流
- `pptxgenjs.md` — 从零创建 PPTX
- `structured.md` — 结构化论证模式（Ghost deck test、Action Title）

**使用方式**: `/pptx` 或当用户提到 "deck"、"slides"、"presentation"、.pptx 文件时自动触发

**脚本工具**:
- `scripts/thumbnail.py` — 生成视觉缩略图
- `scripts/office/unpack.py` — 解包 PPTX 为 XML

---

### impeccable-skill

**类型**: 前端设计技能
**路径**: `.claude/skills/impeccable-skill/SKILL.md`
**来源**: [watchi666/impeccable_claude_code](https://github.com/watchi666/impeccable_claude_code) (Apache 2.0, v3.5.0)

**定位**: 高保真前端设计 Agent，覆盖网站、落地页、仪表盘、产品 UI、组件、表单等。支持 craft/shape/critique/audit 等 35+ 命令。

**核心机制**: 双注册系统（Brand / Product），OKLCH 色彩，10 项 Nielsen 可用性启发式评分

**命令列表**: craft、shape、teach、document、extract、critique、audit、polish、bolder、quieter、distill、harden、onboard、animate、colorize、typeset、layout、delight、overdrive、clarify、adapt、optimize、live 等

**使用方式**: `/impeccable` 或 `/impeccable <command>`

**子参考文件**（35个）: reference/ 目录下，含 brand.md、product.md、craft.md、shape.md、critique.md、audit.md 等

---

### taste-skill

**类型**: 前端设计规范
**路径**: `.claude/skills/taste-skill/SKILL.md`
**来源**: [watchi666/impeccable_claude_code](https://github.com/watchi666/impeccable_claude_code) (Apache 2.0, v3.5.0)

**定位**: Anti-slop 前端设计 Skill，专为落地页、作品集、重新设计而生。不做后台/仪表盘/数据表格。

**核心机制**: 3刻度盘系统
- `DESIGN_VARIANCE` (1-10) — 对称 ↔ 不对称/艺术化
- `MOTION_INTENSITY` (1-10) — 静态 ↔ 动态编排
- `VISUAL_DENSITY` (1-10) — 艺术馆留白 ↔ 驾驶舱紧凑

**Pre-Flight Check**: 14步强制检查，Zero em-dash，Hero首屏可见，Eyebrow≤1/3sections等

**使用方式**: `/skill taste-skill`

---

### product-rd-manager-role

**类型**: 角色规范 (记忆)
**路径**: `~/.claude/projects/-Users-roro-Vibe-coding/memory/product-rd-manager-role.md`
**来源**: 用户配置

**定位**: 兼具产品交互设计与前端工程落地能力，所有需求落地为可运行高保真交互原型代码。

**强制准则**:
1. 产品体验管控 — 最短操作链路，交互反馈≤300ms，全边界场景覆盖
2. 原型等价于可运行代码 — HTML/CSS/JS 组件代码，真实交互逻辑
3. 研发落地风险兜底 — 工时/风险/依赖/迭代成本量化

**固定执行顺序**:
1. 需求补全 → 2. 流程设计(Mermaid) → 3. 代码实现 → 4. 成本评估 → 5. 落地自检

**自检清单**: 交互时效、边界覆盖、代码可运行、成本量化、权限审计

**使用方式**: 参考此角色规范进行产品/需求类任务

---

## 添加新技能

将技能安装到: `.claude/skills/<skill-name>/SKILL.md`

格式要求:
```markdown
---
name: <skill-name>
description: <one-line description>
---

# <Skill Title>
...content...
```

---

## 相关资源

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — 公开技能库 (⭐ 45k+, 207个公开Skill)
- [impeccable](https://github.com/watchi666/impeccable_claude_code) — 高保真前端设计技能源码
- [taste-skill](https://github.com/Leonxlnx/taste-skill) — Anti-slop 设计规范集合