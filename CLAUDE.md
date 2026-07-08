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

---

## 🟠 PRD Diff 交付规范（强制）

**每次代码任务交付时，AI 必须附带 PRD diff 清单。** 禁止代码与 PRD 双向脱节。

### 触发条件
- 任何代码任务交付（feature / fix / refactor）
- 调用 prd-writer skill 时

### PRD Diff 清单格式
AI 交付时必须输出以下 3 段：

```markdown
## PRD Diff 清单

### ✅ 已实现
- [功能点 1] — [对应 PRD 章节]
- [功能点 2] — [对应 PRD 章节]

### ⚠️ 与 PRD 描述的差异
- [差异点 1] — [PRD 写的是 X，代码实现是 Y，原因：...]
- [差异点 2] — [...]

### 📝 建议更新的 PRD 章节
- [章节 1] — [更新原因]
- [章节 2] — [更新原因]
```

### 用户动作
- 收到 PRD diff 后，**必须** 决策是否同步飞书 PRD
- 不允许沉默跳过

### Why
2026-07-08 致命漏洞复盘识别：PRD 与代码长期双轨制，3 个月后会出现"PRD 描述的系统 ≠ 实际系统"的灾难性失同步。

### 关联记忆
- [feishu-prd-links.md](.claude/projects/-Users-roro-Vibe-coding/memory/feishu-prd-links.md)
- [prd-writer-skill-v32.md](.claude/projects/-Users-roro-Vibe-coding/memory/prd-writer-skill-v32.md)

---

*本节最后更新: 2026-07-08 — 来源: 致命漏洞修复执行清单 P1-5*
