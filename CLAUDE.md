# CLAUDE.md — AI 协作硬规则

> 本文件是 AI 协作方的强制约束，每次会话自动加载。规则变更需经用户确认。

---

## 🔴 验证门控规则（强制）

**每个功能类任务交付前，AI 必须有真实运行证据（截图/录屏），不得自行宣称"已实现"。**

### 触发条件
- 用户提出功能开发任务
- AI 完成代码并准备交付
- 任何涉及 UI 交互、表单提交、状态流转、页面跳转的任务

### 执行流程
1. AI 完成代码后，**主动**询问用户："请在浏览器/手机上真实运行一次，提交截图作为验收证据"
2. 用户未提供截图 → AI 拒绝宣告完成，**明确说"未验收，不算交付"**
3. 用户提供截图 → 自动调用 `fal-vision` skill 识别文字 + AI 复核逻辑
4. 截图显示异常 → AI 主动修复后重新申请验收

### 证据形式（任一即可）
- 1 张真实运行截图（带浏览器/手机外壳）
- 1 段操作录屏（≥ 5 秒）
- 1 段 curl/wget 输出（仅限纯 API 任务）

### 例外
- 纯重构（不改 UI/行为）
- 纯文档/注释修改
- 配置/脚本类变更

### 关联记忆
- [verification-gate-rule.md](.claude/projects/-Users-roro-Vibe-coding/memory/verification-gate-rule.md)

---

*最后更新: 2026-07-08 — 来源: 致命漏洞修复执行清单 P0-2*

---

## 🟠 单意图 Commit 规范（强制）

**1 个 commit = 1 个意图。** 禁止把 feature、fix、refactor 混搭在同一个 commit 中。

### 拆分标准
- 涉及 ≥ 3 个独立功能点 → 必须先用 TodoWrite 拆 3-7 个子项
- 每个子项独立 commit
- commit message 明确标注类别：`feat` / `fix` / `refactor` / `docs` / `test` / `chore`

### 拆分前自检
准备 commit 前问自己：本次变更是否只解决 1 件事？
- 是 → 提交
- 否 → 先拆分

### 反例（2026-07-08 复盘发现）
- `e77ba12 feat: 补齐司机档案模块 + 车辆位置加 4 列` — 2 个独立功能塞进 1 个 commit
- `43a3c62 feat: 调车单 confirmed 状态可作废 + cancelled 状态可物理删除` — 2 个独立状态机变更

### Why
粒度不稳定的 commit history 让 code review、问题回溯、版本回滚都变得痛苦。AI 接到大任务时会降级处理细节质量。

### 关联记忆
- [single-intent-commit-rule.md](.claude/projects/-Users-roro-Vibe-coding/memory/single-intent-commit-rule.md)

---

*本节最后更新: 2026-07-08 — 来源: 致命漏洞修复执行清单 P1-4*
