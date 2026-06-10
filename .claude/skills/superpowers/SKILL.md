---
name: superpowers
description: Superpowers Skills 索引 - Claude Code 社区技能库
source: https://github.com/obra/superpowers-skills
---

# Superpowers Skills

> 社区为 Claude Code 打造的可复用技能库。来源：[obra/superpowers-skills](https://github.com/obra/superpowers-skills)

---

## 📂 技能目录 (31个)

| 类别 | 数量 | 技能 |
|------|------|------|
| [协作](#协作-10个) | 10 | brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, remembering-conversations, requesting-code-review, subagent-driven-development, using-git-worktrees, writing-plans |
| [调试](#调试-4个) | 4 | defense-in-depth, root-cause-tracing, systematic-debugging, verification-before-completion |
| [问题解决](#问题解决-6个) | 6 | collision-zone-thinking, inversion-exercise, meta-pattern-recognition, scale-game, simplification-cascades, when-stuck |
| [测试](#测试-3个) | 3 | condition-based-waiting, test-driven-development, testing-anti-patterns |
| [Meta](#meta-5个) | 5 | gardening-skills-wiki, pulling-updates-from-skills-repository, sharing-skills, testing-skills-with-subagents, writing-skills |
| [研究](#研究-1个) | 1 | tracing-knowledge-lineages |
| [架构](#架构-1个) | 1 | preserving-productive-tensions |

---

## 🚀 快速使用

当遇到问题时，直接调用：

- *"用 brainstorming 思考这个方案"*
- *"用 systematic-debugging 排查这个 bug"*
- *"用 test-driven-development 实现功能"*
- *"用 writing-plans 写一个开发计划"*
- *"用 when-stuck 帮我突破困境"*

---

## 📖 技能详情

### 协作 (10个)

#### brainstorming
**路径**: `superpowers/collaboration/brainstorming/SKILL.md`
互动式头脑风暴，使用苏格拉底方法细化想法。

#### dispatching-parallel-agents
使用多个 Agent 并行处理独立问题。

#### executing-plans
批量执行计划，带检查点评审。

#### finishing-a-development-branch
完成工作，提供 merge/PR/cleanup 选项。

#### receiving-code-review
接收和处理代码评审反馈。

#### remembering-conversations
在长对话中保持上下文连贯。

#### requesting-code-review
派遣代码评审子 Agent。

#### subagent-driven-development
每个任务派遣新 Agent，带评审流程。

#### using-git-worktrees
创建隔离的工作空间，智能目录选择。

#### writing-plans
**路径**: `superpowers/collaboration/writing-plans/SKILL.md`
创建详细的实施计划（为零上下文工程师设计）。

---

### 调试 (4个)

#### defense-in-depth
在每一层验证，使 bug 不可能存在。

#### root-cause-tracing
通过调用栈向后追踪 bug。

#### systematic-debugging
**路径**: `superpowers/debugging/systematic-debugging/SKILL.md`
四阶段调试框架：
1. 根因调查
2. 模式分析
3. 假设与测试
4. 实现

#### verification-before-completion
在宣称成功前运行验证。

---

### 问题解决 (6个)

#### collision-zone-thinking
强制将不相关的概念结合。

#### inversion-exercise
翻转假设以揭示替代方案。

#### meta-pattern-recognition
在3+领域发现模式。

#### scale-game
在极端情况下测试（1000倍更大/更小）。

#### simplification-cascades
找到消除多个组件的洞察。

#### when-stuck
根据卡住类型派遣到正确技术。

---

### 测试 (3个)

#### condition-based-waiting
用条件轮询替代任意超时。

#### test-driven-development
**路径**: `superpowers/testing/test-driven-development/SKILL.md`
先写测试，看失败，写最少代码通过。
**铁律**：没有失败的测试就不写生产代码。

#### testing-anti-patterns
永远不测 mock 行为，永远不添加仅测试用的方法。

---

### Meta (5个)

#### gardening-skills-wiki
维护 wiki 健康，检查链接/命名。

#### pulling-updates-from-skills-repository
与上游同步更新。

#### sharing-skills
通过 branch 和 PR 贡献。

#### testing-skills-with-subagents
用子 Agent 测试技能（TDD for 流程文档）。

#### writing-skills
**路径**: `superpowers/meta/writing-skills/SKILL.md`
如何创建经过良好测试的技能。
**铁律**：没有失败测试就不写技能。

---

### 研究 (1个)

#### tracing-knowledge-lineages
理解想法如何随时间演变。

---

### 架构 (1个)

#### preserving-productive-tensions
保留有价值的分歧。

---

## 🔑 核心原则

1. **技能不是叙事** — 是可复用的技术和模式
2. **YAML frontmatter 至关重要** — `when_to_use` 字段是发现机制的关键
3. **一个好例子胜过多个平庸例子**
4. **Token 效率** — 频繁加载的技能 <200 words
5. **技能强制纪律** — 需要压力测试防止合理化

---

## ⚠️ 强制工作流

### 任务开始前检查清单

1. **检查技能列表** — 运行 `find-skills [PATTERN]` 过滤
2. **读取相关技能** — 使用 Read 工具，完整路径含 `/SKILL.md`
3. **宣布使用** — "I've read [Skill Name] skill and I'm using it to [purpose]"
4. **严格遵循** — 按技能定义执行

### 铁律

- **不跳过 brainstorming** — 编码前必须头脑风暴
- **不跳过 TDD** — 没有失败测试就不写生产代码
- **不跳过根因调查** — 没有根因调查就不修复

---

## 🔗 相关资源

- [GitHub 仓库](https://github.com/obra/superpowers-skills)
- [Superpowers Marketplace](https://github.com/obra/superpowers-marketplace)
- [Superpowers Lab](https://github.com/obra/superpowers-lab) (实验性技能)