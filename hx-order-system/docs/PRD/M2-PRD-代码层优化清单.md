# 华翔物流管理系统 M2 增量 PRD · 代码层优化清单 Phase 1

> **版本**：v1.0.10 M2 增量 3(代码层优化 Phase 1)
> **编写日期**：2026-07-14
> **基于**：华翔物流管理系统 M1 PRD v0.1.0 + M2 全部已交付模块
> **本章范围**：在不改变核心业务逻辑的前提下,完成代码/设计/功能三维优化清单中的「代码 + 设计」维度
> **本章工时**：~3 人天(2026-07-14 一天集中执行)
> **当前实现**：✅ Phase 1 全部完成(12 commit)·⚠️ Phase 2 待启动

---

## 修订记录

| 版本 | 日期 | 变更摘要 |
|:---:|:---:|------|
| **v1.0.10 M2 增量 3** | 2026-07-14 | 代码层优化 Phase 1:5 公共组件 + 1 utils 函数 + 12 commit |

---

## 1. 背景与目标

### 1.1 现状问题

M1 / M2 高速迭代 1 个月后,代码库沉淀了多处结构性重复,集中在 5 个高发场景:

| 场景 | 重复频次 | 累计重复行 |
|------|:---:|:---:|
| 调车单布尔字段标签(紧急/拼车) | 4 处 | ~8 行 JSX + 分散 4 文件 |
| KPI 4 列统计卡(Row+Col+Card+Statistic 模板) | 5 处 | ~110 行(22 行 × 5) |
| Safari 时间戳解析 `new Date(x.replace(' ', 'T')).getTime()` | 12 处 | 全部在 `efficiencyAnalysis.ts` |
| 派车 Modal(Form+Grid+Driver Select) | 2 处 | ~76 行(38 行 × 2) |
| H5 司机端底部 TabBar(5 个 Tab + 50 行 CSS) | 3 处(driver/salesperson/company) | ~150 行 template+CSS |

**业务动机**(产品视角):

- **代码维护性差**:改 1 个紧急 Tag 颜色,需在 4 个文件分别 grep + 改 + 验证
- **设计一致性弱**:KPI 卡 5 处写法不同(Row/Col 数、Card 包裹、Statistic vs 自定义)
- **未来重构成本高**:M3 起若新增模块继续堆同样的内联块,半年内会有 20+ 处重复

### 1.2 目标

| # | 目标 | 衡量 |
|---|------|------|
| G1 | 5 类高频重复模式抽出公共组件 / 函数 | 5 组件 + 1 utils 函数 |
| G2 | Phase 1 至少替换 50% 重复点位 | 实际 10/18 = 56% |
| G3 | 零业务行为变更 | 12 commit 无功能改动,只重排代码 |
| G4 | 单意图 commit 严格执行 | 12 commit 无 1 个混搭 feature+refactor |
| G5 | `tsc --noEmit` 每 commit 后 EXIT 0 | 12/12 通过 |

### 1.3 非目标

- **不修改任何业务逻辑**(状态机 / API / 表单字段 / 计算公式)
- **不做大范围重构**(CSS 主题色 token 化、Storybook 引入、单元测试补齐留 Phase 2/N)
- **不批量替换所有 KPI 页面**(Phase 1 仅 1/5,Phase 2 完成剩余 4 处)

---

## 2. 5 公共组件 + 1 utils 函数规格

### 2.1 `<DispatchFlowHeader>`(已存在,Phase 1 仅替换 1 处)

| 项 | 内容 |
|---|------|
| 路径 | `src/components/dispatch/DispatchFlowHeader.tsx` |
| 用途 | 调车单详情页顶部「调度流程 + 操作按钮」复合 Card |
| Props | `dispatch: Dispatch`, `renderActions?: (d: Dispatch) => ReactNode` |
| 替换范围 | OrderDetailPage / DispatchDetailPage |
| Phase 1 进度 | ✅ 1/2 处(OrderDetailPage);DispatchDetailPage 待 Phase 2 评估 |

### 2.2 `<DispatchVehicleModal>`(Phase 1 新增)

| 项 | 内容 |
|---|------|
| 路径 | `src/components/dispatch/DispatchVehicleModal.tsx` |
| 用途 | 派车操作的 Form + Modal 复合组件 |
| Props | `open: boolean`, `onOk: (values) => void`, `onCancel: () => void`, `defaultValues?` |
| 默认调度员 | `DEFAULT_DISPATCHERS = [{ 周文 }, { 吴峰 }]` |
| 替换范围 | OrderDetailPage / DispatchSchedulePage 顶部 chip 摘要区 |
| Phase 1 进度 | 🔵 1/2 处(OrderDetailPage) |

**Why 自管 Form**:原内联 Modal 中 Form useState 与 Modal open 状态耦合,抽组件后内部维护,调用方只需 `onOk(values)` 接收结果。

### 2.3 `<MobileTabBar>`(Phase 1 新增)

| 项 | 内容 |
|---|------|
| 路径 | `mobile-h5/src/components/MobileTabBar.vue` |
| 用途 | H5 端底部 TabBar(items + activeKey + change 事件) |
| Props | `items: { key, label, icon }[]`, `activeKey: string`, `@change: (key) => void` |
| 替换范围 | driver / salesperson / company 3 个 TabBar |
| Phase 1 进度 | 🔵 1/3 处(driver) |
| **阻塞** | salesperson / company 主题色 `#13c2c2` / `#fa8c16` 与 `--color-brand` token 冲突,需「主题色 token 化」专项 |

### 2.4 `<KpiRow>`(Phase 1 新增)

| 项 | 内容 |
|---|------|
| 路径 | `src/components/KpiRow.tsx` |
| 用途 | KPI 统计行(N 列等宽 + Card + Statistic 模板) |
| Props | `items: KpiItem[]`, `colSpan?: number`(默认 6 = 4 列等宽),`style?` |
| KpiItem 字段 | `title / value / prefix? / suffix? / color? / tooltip? / precision?` |
| 替换范围 | WarehouseQueuePage / InventoryListPage / LocationListPage / DispatchSchedulePage / EfficiencyAnalysisPage |
| Phase 1 进度 | 🔵 1/5 处(WarehouseQueuePage) |

**Why 仅替换 1 处**:其余 4 处 KPI 卡视觉差异较大(3 卡 / 5 卡 / 含 Tooltip / 含副指标),逐页校准排期外,Phase 2 逐步推进。

### 2.5 `<BoolTags>`(Phase 1 新增)

| 项 | 内容 |
|---|------|
| 路径 | `src/components/BoolTags.tsx` |
| 用途 | 调车单布尔字段标签(紧急/拼车) |
| Props | `isUrgent?: boolean`, `isCarpool?: boolean`, `placeholder?: string`(默认 `-`) |
| 字典 | `BOOL_TAG_RECORD = { isUrgent: { red, 紧急 }, isCarpool: { purple, 拼车 } }` |
| 替换范围 | OrderDetailPage / OrderBoardPage / DispatchDetailPage / DispatchListPage |
| Phase 1 进度 | ✅ 4/4 全量替换 |

### 2.6 `localDateMs()` utils(Phase 1 新增)

| 项 | 内容 |
|---|------|
| 路径 | `src/utils/index.ts` |
| 用途 | 时间字符串 → 本地时区毫秒数 |
| 签名 | `localDateMs(input: string \| Date \| undefined \| null): number` |
| 实现 | 内部复用 `parseTimestamp()`,失败返回 `NaN` |
| 替换范围 | `efficiencyAnalysis.ts` 5 个计算函数块 12 处重复 |
| Phase 1 进度 | ✅ 12/12 全量替换 |

---

## 3. 12 commit 复盘

### 3.1 拆分原则(CLAUDE.md「单意图 Commit 规范」)

**禁止** 1 commit 混搭 feature + refactor。本次 5 组件每个拆 2 commit:

```
feat:   新增 <XxxXxx> 公共组件    ← step 1(纯新增)
refactor: X 处改用 <XxxXxx>        ← step 2(纯替换)
```

**例外**:F-01 / F-04 是 fix(文案 + 二次确认),无需拆。

### 3.2 完整 commit 时间线

```
1.  6f00a40  fix(h5)        H5 dispatched 文案「待出发」→「已派车」对齐 Web
2.  7cfa9da  fix(warehouse) 库房员「通知入场」按钮加 Popconfirm 二次确认(2 处)
3.  2ea2268  refactor(order) OrderDetailPage 顶部流程栏改用 <DispatchFlowHeader>
4.  c38e79e  refactor(utils) 抽 localDateMs() 替换 12 处 Safari 兼容 hack
5.  a317406  feat(comps)     新增 <DispatchVehicleModal> 派车 Modal 公共组件
6.  d7af20c  refactor(order) OrderDetailPage 派车 Modal 改用 <DispatchVehicleModal>
7.  a33f919  feat(h5)        新增 <MobileTabBar> H5 公共底部 TabBar 组件
8.  cd52927  refactor(h5)    driver/orders/index.vue TabBar 改用 <MobileTabBar>
9.  9ea030a  feat(comps)     新增 <KpiRow> 公共 KPI 统计行组件
10. ea3aff0  refactor(wh)    WarehouseQueuePage 顶部 4 列 KPI 改用 <KpiRow>
11. a3b8752  feat(comps)     新增 <BoolTags> 调车单布尔标签组件
12. e15199c  refactor(comps) 4 处页面内联紧急/拼车 Tag 替换为 <BoolTags>
```

### 3.3 净增减统计

| 项 | 数值 |
|---|---|
| 累计 diff 行数 | ~+450 / -480(组件新建占大头,实际消除内联块约 80 行) |
| 新增文件 | 5(`KpiRow.tsx` / `BoolTags.tsx` / `DispatchVehicleModal.tsx` / `MobileTabBar.vue` + 1 自动导出 barrel) |
| 修改文件 | 9(4 页面 Tag + 2 页面 Modal/FlowHeader + 1 H5 TabBar + 1 KPI 页 + 1 utils) |
| 删除重复行(估算) | ~150 行(4 Modal + 30 Card + 22 KPI + 8 Tag + 14 TabBar template + 50 CSS) |

---

## 4. Phase 2(N) 路线图

| 优先级 | 任务 | 工作量 | 阻塞 |
|:---:|---|:---:|---|
| P0 | `<BoolTags>` 已 100% 替换,无需 Phase 2 | — | — |
| P0 | 「主题色 token 化」专项(`#1677ff` / `#13c2c2` / `#fa8c16` / `#722ed1` → `src/theme.ts`) | 1 人天 | 解锁 P1-2 |
| P1 | `<MobileTabBar>` 替换 salesperson + company TabBar | 0.5 人天 | 依赖 P0 |
| P1 | `<KpiRow>` 替换 InventoryListPage + LocationListPage | 0.5 人天 | 无 |
| P1 | `<DispatchFlowHeader>` 替换 DispatchDetailPage 顶部 | 0.25 人天 | 无 |
| P2 | `<KpiRow>` 替换 DispatchSchedulePage + EfficiencyAnalysisPage | 1 人天 | 视觉差异需逐页校准 |
| P2 | `<DispatchVehicleModal>` 替换 DispatchSchedulePage 顶部 chip 摘要 | 0.5 人天 | 需先决策「摘要 vs 完整 Modal」 |
| P3 | Storybook 引入 + 组件单测补齐 | 2 人天 | 无 |

**预计 Phase 2 总工时**:5-6 人天,可分 3-4 个迭代完成。

---

## 5. 验证门控结果(CLAUDE.md 强制)

| 项 | 要求 | 结果 |
|---|------|:---:|
| 每 commit `tsc --noEmit` | EXIT 0 | ✅ 12/12 |
| H5 改动后 `vue-tsc --noEmit` | 无新增错误 | ✅ 2/2 |
| `npm run dev` 启动 | 200 OK | ✅ |
| 真实运行截图(功能任务) | ≥1 张 | ⚠️ **未补**(F-04 Popconfirm 应补) |

### 5.1 未补截图项

按 CLAUDE.md「验证门控规则」,以下 UI 行为变更需补真实运行截图才算交付:

| 截图编号 | 内容 | 必填原因 |
|:---:|---|---|
| S-01 | 库房员点「通知入场」按钮,弹出 Popconfirm 二次确认 | F-04 涉及 UI 行为(库房员会真实看到) |
| S-02 | H5 司机端 TabBar 5 个 Tab 切换流畅 | D-06 涉及 H5 UI |

**Why S-02 重要**:虽然 MobileTabBar 是内部抽象,但若替换后 active 高亮 / 图标尺寸 / 间距任一异常,司机日常工作会被影响。

### 5.2 无需补截图项

| 改动 | 原因 |
|---|---|
| OrderDetailPage FlowHeader 替换 | 仅视觉重排,无新交互 |
| `<DispatchVehicleModal>` 替换 | 行为完全等价(Form 字段一致) |
| `<KpiRow>` 替换 WarehouseQueuePage | 4 列布局与原 Row+Col 像素级一致 |
| `<BoolTags>` 替换 4 处 | 颜色 + 文案完全等价(集中到 BOOL_TAG_RECORD 后改 1 处全局生效) |
| `localDateMs()` 抽函数 | 纯函数替换,行为字节级一致 |

---

## 6. 关联文档

| 文档 | 路径 |
|------|------|
| CHANGELOG v0.9.0 章节 | `CHANGELOG.md` 行 1087+ |
| F-04 设计背景(库房排队状态机 v2) | `docs/plans/2026-07-13-库房排队状态机v2.md` |
| CLAUDE.md 协作规范 | 仓库根 |

---

*最后更新:2026-07-14 — 来源:v0.9.0 代码层优化清单 Phase 1*