---
name: prd-writer
description: Use when user asks to generate a Product Requirements Document (PRD) for their product idea, feature, or project.
version: 1.0.0
author: claude
created: 2026-05-18
tags: [PRD, product, requirements, document]
---

# PRD Writer Skill

**触发词**：`帮我写PRD` / `生成产品需求文档` / `写产品文档` / `生成产品原型` / `写一个产品文档`

**前置条件**：用户提供产品描述（功能想法、业务场景、项目背景等均可）

**输出**：完整PRD初稿（含中文ASCII组件树），等待用户确认后再写入飞书

## Overview

Generates professional Product Requirements Documents (PRD) for internet products. Follows standards from ByteDance, Alibaba, Tencent, Meituan, etc. Outputs structured templates with tables and Chinese ASCII component trees. **Requires user confirmation before writing to Feishu.**

**Design for OpenCLAW compatibility:** The prototype section uses Chinese ASCII component trees, designed for easy parsing by OpenCLAW when generating subsequent HTML high-fidelity prototypes.

---

## Workflow

```
User Input Product Description
    |
    v
Identify Product Category (C端/B端/数据/AI/通用)
    |
    v
Generate PRD Draft (structured template)
    |
    v
Output for User Confirmation
    |
    v
[User confirms OK]
    |
    v
Ask: "是否需要写入飞书文档？"
    |
    v
[User confirms Yes]
    |
    v
Write to Feishu Document
```

---

## Product Category Detection

Automatically identify product category from user description:

| Category Keywords | Product Type |
|-------------------|--------------|
| 用户端、App、小程序、社交、电商、直播 | C端产品 |
| 后台、系统管理、SaaS、企业、内部系统 | B端产品 |
| 数据看板、图表、分析、报表、BI | 数据产品 |
| AI功能、智能、算法、推荐、NLU | AI/算法产品 |
| 模糊/未明确 | 通用产品 |

---

## Usage Example

**User Input:**
> "帮我写一个社交App的PRD，主要功能是附近的人聊天、AI匹配、阅后即焚"

**Skill Response:**
1. 识别为 C端产品
2. 生成完整PRD（7个章节）
3. 输出示例：

```markdown
# 产品名称：附近约玩社交App

## 1. 产品概述
[表格：产品背景、目标、范围...]

## 2. 用户分析
[用户画像：18-25岁年轻用户...]
[用户旅程：发现→匹配→聊天→关系]
[需求痛点：P0-真实性、 P1-匹配效率...]

## 3. 需求详述
### 功能列表
[脑图结构]

### 原型描述（示例页面）
页面ID: P001
页面名称: 发现页
组件树:
根节点
├── 顶部导航栏
│   ├── 搜索图标
│   └── 消息图标
├── 附近用户卡片列表
│   ├── 用户卡片
│   │   ├── 头像（大图）
│   │   ├── 昵称
│   │   ├── 距离标签
│   │   └── AI匹配度Badge
│   └── ...（更多卡片）
└── 底部TabBar
    ├── 发现
    ├── 消息
    └── 我的
```

**Next Step:** 等待用户确认后询问"是否需要写入飞书文档？"
```

---

## When NOT to Use

| ❌ 不适合场景 | 说明 |
|--------------|------|
| 技术方案设计 | PRD聚焦"做什么"，不是"怎么做" |
| UI设计稿 | 用原型工具而非PRD描述UI |
| 项目计划/排期 | 用甘特图/项目管理工具 |
| 纯市场分析 | 用竞品分析文档(MRD) |
| 已上线产品的迭代需求 | 用需求列表/迭代文档 |

---

## PRD Document Structure

### 1. 产品概述

| Section | Description |
|---------|-------------|
| 产品名称 | 项目/产品名称 |
| 产品背景 | 业务场景、用户需求、市场机会 |
| 产品目标 | 核心目标、SMART目标拆解 |
| 产品范围 | 功能边界、非功能范围、版本规划 |
| 名词定义 | 关键术语解释 |

### 2. 用户分析

| Section | Description |
|---------|-------------|
| 用户画像 | 用户群体特征、角色卡片 |
| 用户旅程 | 用户使用路径、关键触点 |
| 需求痛点 | 核心痛点、优先级(P0/P1/P2) |

### 3. 需求详述

| Section | Description |
|---------|-------------|
| 功能列表 | 核心功能清单、脑图结构 |
| 功能流程 | 业务流程图、页面流程 |
| 原型描述 | 页面说明、交互细节 |

### 4. 数据指标

| Section | Description |
|---------|-------------|
| 核心指标 |北极星指标、指标定义 |
| 埋点需求 | 事件埋点、参数设计 |

### 5. 非功能需求

| Section | Description |
|---------|-------------|
| 性能需求 | 响应时间、并发量 |
| 安全需求 | 权限设计、数据安全 |
| 兼容性 | 适配要求、平台支持 |

### 6. 项目排期

| Section | Description |
|---------|-------------|
| 版本规划 | MVP版本、迭代计划 |
| 里程碑 | 关键节点、时间规划 |
| 依赖关系 | 外部依赖、内部依赖 |

### 7. 附录

| Section | Description |
|---------|-------------|
| 术语表 | 行业术语解释 |
| FAQ | 常见问题解答 |

---

## Page Prototype Description Format

**Standard:** Chinese ASCII component tree

**Structure per page:**
```
页面ID: [page_id]
页面名称: [page_name]
页面描述: [page_description]

组件树:
根节点
├── 组件A
│   ├── 子组件A1
│   │   └── 叶子组件A1a
│   └── 子组件A2
│       └── 叶子组件A2a
├── 组件B
│   └── (同上)
```

**Rules:**
1. Every component uses Chinese names (e.g., "顶部导航栏" not "Header")
2. Leaf components are at the lowest nesting level
3. Each page is self-contained with clear ID and description
4. Designed for OpenCLAW to parse and generate HTML prototypes

---

## Output Format

**Style:** Structured template with tables + Chinese ASCII component trees

**Length:** Comprehensive but concise per section

**Tone:** Professional, objective, data-driven

**Prototype Format:** Chinese ASCII trees for each page

---

## Decision Rules

1. **Always confirm before Feishu write** — Never auto-write
2. **Auto-detect product category** — No manual selection needed
3. **Full module coverage** — Always include all 7 sections
4. **Structured over narrative** — Tables > paragraphs
5. **Chinese component names** — All component trees use Chinese names

---

## Common Mistakes

| Mistake | Prevention |
|---------|-------------|
| Skipping user analysis section | Always include all sections |
| Writing before user confirms | Require explicit confirmation |
| Too vague on metrics | Specify concrete numbers |
| Missing version planning | Always include version milestones |
| Using English component names | Use Chinese names for OpenCLAW compatibility |

---

## Quick Reference

| 项目 | 内容 |
|------|------|
| **触发词** | 帮我写PRD / 生成产品需求文档 / 写产品文档 / 生成产品原型 |
| **必需信息** | 用户提供的产品描述 |
| **输出** | 完整PRD初稿（含中文ASCII组件树） |
| **下一步** | 等待用户确认后，询问"是否写入飞书？" |

---

## Production Checklist

PRD输出前自检：

```
✅ 产品类别已识别（C端/B端/数据/AI/通用）
✅ 7个章节全部包含（产品概述/用户分析/需求详述/数据指标/非功能需求/项目排期/附录）
✅ 原型描述使用中文ASCII组件树
✅ 每个功能模块有明确的P0/P1/P2优先级
✅ 北极星指标有具体数字定义
✅ MVP版本有明确里程碑
✅ 用户已确认后再写入飞书
```

---

## Feishu Write Integration

When user confirms and wants to write to Feishu:
1. Use `lark-cli docs +create --api-version v2` to create new document
2. Use markdown format for document content
3. Return the document URL to user
4. Update memory with document link

---

## Prototype-to-HTML Workflow

This skill generates the PRD. For subsequent HTML prototype generation:
1. OpenCLAW reads the Chinese ASCII component trees
2. OpenCLAW generates HTML with proper component structure
3. The component tree structure maps directly to HTML DOM hierarchy

---

## Changelog

| 版本 | 日期 | 改进内容 |
|:---|:---|:---|
| v1.0.0 | 2026-05-18 | 初版（基础PRD结构 + 中文ASCII组件树）|
| v1.1.0 | 2026-05-23 | 优化：frontmatter扩展、触发词前置、使用示例、反面场景、Production Checklist |