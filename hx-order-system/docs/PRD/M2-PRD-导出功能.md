# 华翔物流管理系统 M2 增量 PRD · 调度时效分析-导出功能

> **版本**：v1.0.9 M2 增量 2（M2.4 调度时效可视化升级）
> **编写日期**：2026-07-14
> **基于**：华翔物流管理系统 M1 PRD v0.1.0 + 调度时效分析（M2 上一轮已交付，本文档不重复）
> **本章范围**：在「调度时效分析」页新增 Excel 导出功能 + 5 漏斗计数 + 园区对比柱状图
> **本章工时**：~0.6 + 4.5 人天（M2.4 增量）
> **当前实现**：✅ M2 增量 1 + ✅ M2.4 增量 2 完成

---

## 修订记录

| 版本 | 日期 | 变更摘要 |
|:---:|:---:|------|
| **v1.0.8 M2 增量 1** | 2026-07-10 | 调度时效分析页新增 Excel 导出（4 Sheet 多 Sheet 全量导出） |

> ⚠️ **PRD 缺口记录**：上一轮「调度时效分析」功能（5 指标卡 + 5 筛选 + 4 Tab）开发时**未补 PRD**，导致本文档无法直接引用既有章节。本增量 1 文档假设调度时效分析已上线，仅描述导出增量。**强烈建议下一轮补完整 `M2-PRD-调度时效分析.md`**。

---

## 1. 背景与目标

### 1.1 现状问题

调度时效分析页上线后，HR 与物流主管只能**在线查看**数据：
- 跨部门汇报需要把数据搬到 PPT / Word，手动截图复制
- 想发到钉钉群 / 邮件分享给领导，必须先截图
- 离线归档、打印月度报告无数据源
- 多 Tab 数据（明细 + 3 个分组榜）无法批量导出

### 1.2 目标

| # | 目标 | 衡量 |
|---|------|------|
| G1 | 一键导出当前筛选结果，覆盖 4 个 Tab | 单次点击 ≤ 3 秒生成 xlsx |
| G2 | 导出与筛选强联动，行为可预期 | 选「上海 + 2026-06」导出仅上海 6 月数据 |
| G3 | 不依赖后端，纯前端生成 | M2 阶段 mock 数据 < 100 行，前端导出无压力 |
| G4 | 文件命名规范统一，便于归档 | 模板 `调度时效分析_YYYYMMDD_HHmm.xlsx` |

---

## 2. 范围 / 不在范围

### 2.1 本增量包含

- ✅ 「调度时效分析」页顶部新增 `[📥 导出 Excel]` 按钮
- ✅ 单文件 4 Sheet：调车单明细 / 按公司 / 按装货园区 / 按运输方向
- ✅ 仅导出当前 5 维筛选结果（时间范围 / 运输方向 / 发运方式 / 物流公司 / 装货园区）
- ✅ 文件命名：`调度时效分析_YYYYMMDD_HHmm.xlsx`
- ✅ 空数据时按钮 disabled
- ✅ 时间戳展示格式：`YYYY-MM-DD HH:mm`（去掉秒数和 ISO T）

### 2.2 本增量不包含

- ❌ CSV / PDF 导出（HR 场景 95% 用 xlsx，其他格式下一轮评估）
- ❌ 用户自定义文件名（HR 不会改文件名）
- ❌ 异步任务 + 邮件发送（数据量 < 100 行，无需异步）
- ❌ 导出历史记录（无业务诉求）
- ❌ 后端流式导出（> 10000 行才需要，列入 §6 风险）

---

## 3. 关键决策（3 项已对齐）

| # | 维度 | 选定方案 | 替代方案 + 放弃原因 |
|---|------|----------|---------------------|
| ① | **Sheet 数量** | **多 Sheet 全量**（1 个 xlsx 含 4 个 Sheet） | B. 单 Sheet 仅当前 Tab（HR 要导 3 次）<br>C. 单 Sheet 仅明细（丢掉分组榜数据） |
| ② | **筛选联动** | **仅当前筛选结果** | b. 忽略筛选导全量（不符合 HR 直觉）<br>c. Sheet 名带筛选摘要（Sheet 名过长） |
| ③ | **技术选型** | **SheetJS `xlsx` ^0.18.5**（已装） | exceljs（500KB gzip 过度）<br>xlsx-js-style（维护不活跃）<br>CSV（中文易乱码） |

---

## 4. 详细设计

### 4.1 用户故事

- **US-EXP-001** 作为 HR 管理员，我希望能一键导出当前筛选的调度时效分析数据，便于线下汇报与归档。
- **US-EXP-002** 作为 HR 管理员，我希望导出的 xlsx 包含明细 + 3 个分组 Tab，无需切换导出 3 次。
- **US-EXP-003** 作为 HR 管理员，我希望导出文件命名规范统一，便于按时间排序归档。
- **US-EXP-004** 作为 HR 管理员，我希望选完筛选条件再导出，结果可预期。

### 4.2 业务流程图

```
HR 管理员
   ↓
[调度时效分析] 页面
   ↓
选择 5 维筛选条件（时间 / 方向 / 方式 / 公司 / 园区）
   ↓
点击 [📥 导出 Excel]
   ↓
[工具 exportDispatchEfficiency]
   ↓  ├─ Sheet 1: 调车单明细（按 analyses 拍平）
   ↓  ├─ Sheet 2: 按公司（按 groupedByCompany 拍平）
   ↓  ├─ Sheet 3: 按装货园区（按 groupedByYard 拍平）
   ↓  └─ Sheet 4: 按运输方向（按 groupedByDirection 拍平 + SLA 列）
   ↓
XLSX.writeFile() → 浏览器下载
   ↓
📥 调度时效分析_20260710_1430.xlsx
```

### 4.3 4 Sheet 字段定义

#### Sheet 1：调车单明细（13 列）

| # | 列名 | 数据源 | 示例 |
|:-:|------|--------|------|
| 1 | 调车编号 | `analyses[].dispatchNo` | DC20260621001 |
| 2 | 运输方向 | `analyses[].direction` | 杭州 |
| 3 | 发运方式 | `analyses[].shippingMethod` | 自送 |
| 4 | 物流公司 | `analyses[].companyName` | 华东快运 |
| 5 | 装货园区 | `yardIds → yardLookup[].name` 拼接 | 园区 A、园区 B |
| 6 | 计划装货时间 | `dispatch.expectedLoadTime` | 2026-06-21 10:00 |
| 7 | 主园区入场时间 | `dispatch.yardTimelines[0].enteredAt` | 2026-06-21 10:05 |
| 8 | 到场差异 | `analyses[].arrivalDiffMin` | 5 |
| 9 | 及时到场 | `analyses[].isOnTimeArrival` | 是 / 否 / - |
| 10 | 签收时间 | `analyses[].signedAt` | 2026-06-22 18:30 |
| 11 | 到货用时 | `analyses[].deliveryHours` | 32.5h |
| 12 | 方向SLA | `DIRECTION_DELIVERY_SLA_HOURS[direction]` | 8h |
| 13 | 及时到货 | `analyses[].isOnTimeDelivery` | 是 / 否 / - |

#### Sheet 2：按公司（6 列）

| # | 列名 | 数据源 |
|:-:|------|--------|
| 1 | 排名 | 1, 2, 3... |
| 2 | 分组 | companyName |
| 3 | 总单数 | total |
| 4 | 平均装货用时 | formatMinutes(avgLoadMin) |
| 5 | 及时到场率 | "x%"（分母为 0 时显示 "-"） |
| 6 | 及时到货率 | "x%" |

#### Sheet 3：按装货园区（6 列）

同 Sheet 2 结构，`分组` 列为 yardName 拼接。

#### Sheet 4：按运输方向（6 列）

| # | 列名 | 数据源 |
|:-:|------|--------|
| 1 | 排名 | 1, 2, 3... |
| 2 | 运输方向 | direction |
| 3 | 方向SLA | `DIRECTION_DELIVERY_SLA_HOURS[direction]` |
| 4 | 总单数 | total |
| 5 | 及时到货率 | "x%" |
| 6 | 及时到场率 | "x%" |

### 4.4 文件命名规范

```
调度时效分析_{YYYYMMDD}_{HHmm}.xlsx
```

**示例**：
- `调度时效分析_20260710_1430.xlsx`（2026-07-10 14:30 生成）
- `调度时效分析_20260710_0900.xlsx`（2026-07-10 09:00 生成）

**为什么不带筛选摘要**：文件名过长在钉钉/邮件客户端显示不全，HR 不会去删。

### 4.5 按钮交互

| 状态 | 行为 |
|------|------|
| 当前筛选结果 ≥ 1 条 | `[📥 导出 Excel]` primary 色，可点击 |
| 当前筛选结果 = 0 条 | 按钮 disabled（变灰） |
| 点击中 | Ant Design 默认 loading 状态（M2 阶段数据量小，几乎瞬时） |

### 4.6 关键实现

#### 工具入口

```typescript
// src/utils/excelExport.ts
export function exportDispatchEfficiency(params: ExportParams): void
```

#### 入参

```typescript
interface ExportParams {
  analyses: DispatchEfficiency[]              // 明细
  groupedByCompany: GroupRowForExport[]       // 按公司
  groupedByYard: GroupRowForExport[]          // 按装货园区
  groupedByDirection: GroupRowForExport[]     // 按运输方向
  dispatchLookup: Record<string, Dispatch>    // 拿 expectedLoadTime / yardTimelines[0].enteredAt
  yardLookup: Record<string, string>          // yardId → yardName
}
```

#### Page 端集成

```typescript
// EfficiencyAnalysisPage.tsx
const yardLookup = useMemo(() => buildYardLookup(yards), [yards])
const dispatchLookup = useMemo(() => buildDispatchLookup(list), [list])

const handleExport = () => {
  exportDispatchEfficiency({
    analyses,
    groupedByCompany,
    groupedByYard,
    groupedByDirection,
    dispatchLookup,
    yardLookup,
  })
}

// PageContainer extra 区域
<Space>
  <Button type="primary" icon={<DownloadOutlined />}
    onClick={handleExport} disabled={analyses.length === 0}>
    导出 Excel
  </Button>
  <Button icon={<ReloadOutlined />} onClick={() => load()}>
    手动刷新
  </Button>
</Space>
```

---

## 5. 验收标准（AC）

| # | AC 编号 | 验收点 |
|:-:|--------|--------|
| 1 | AC-EXP-01 | 页面顶部右侧显示 `[📥 导出 Excel]` primary 按钮 |
| 2 | AC-EXP-02 | 当前筛选结果 ≥ 1 条时按钮可点击；= 0 条时按钮 disabled |
| 3 | AC-EXP-03 | 点击导出后浏览器立即下载 xlsx 文件 |
| 4 | AC-EXP-04 | 文件名格式：`调度时效分析_YYYYMMDD_HHmm.xlsx` |
| 5 | AC-EXP-05 | 打开 xlsx 含 4 个 Sheet：调车单明细 / 按公司 / 按装货园区 / 按运输方向 |
| 6 | AC-EXP-06 | Sheet 1（明细）含 13 列，列顺序与 §4.3 一致 |
| 7 | AC-EXP-07 | Sheet 2-3（公司/园区）含 6 列 |
| 8 | AC-EXP-08 | Sheet 4（运输方向）含 6 列且有 `方向SLA` 列 |
| 9 | AC-EXP-09 | 切换筛选条件（仅选「上海」），导出的 xlsx 中**仅**含上海方向的调车单 |
| 10 | AC-EXP-10 | 时间戳格式为 `YYYY-MM-DD HH:mm`（不带秒、不带 ISO T） |
| 11 | AC-EXP-11 | 百分比列显示为 `xx%` 文本，**不被 Excel 自动转为小数** |
| 12 | AC-EXP-12 | 未签收的调车单 `签收时间/到货用时/方向SLA/及时到货` 显示 `-` |
| 13 | AC-EXP-13 | 无到场时间的调车单 `到场差异/及时到场` 显示 `-` |

---

## 6. 风险与边界

| 风险项 | 影响 | 缓解 |
|--------|------|------|
| **大数据量** | 1 万行以上前端 SheetJS 会卡 5-10 秒 | 当前 mock 数据 < 100 行，**列入 v1.0.9+ 后端流式导出** |
| **SheetJS 中文** | 旧版 SheetJS 中文文件名偶尔乱码 | ^0.18.5 已修复；如出现回退到 `xlsx-js-style` |
| **Excel 单元格解析** | 百分比列如写 `0.5` 会被解读为 50% | 强制写字符串 `"50%"`（已实现 formatPercent） |
| **导出与筛选状态不一致** | 切换 Tab 时导出按钮未刷新 | `disabled={analyses.length === 0}` 实时计算 |
| **多 Tab 数据不一致** | 4 Sheet 数据分别来自 4 个 useMemo，理论上应同步 | Page 端 4 个 useMemo 都依赖 `analyses`，已保证同源 |
| 🐞 **【P1 · 下一轮修】`parseTimestamp` NaN bug 暴露**：基础工具 `parseTimestamp('YYYY-MM-DD HH:mm:ss')` 会替换为 `'YYYY/MM/DDTHH:mm:ss'` 格式，Chrome 解析返回 NaN。导致 `arrivalDiffMin` 全部计算为 0，**「及时到场率」虚高到 100%**（0 ≤ 30min 都判 true）。导出 xlsx 把这个 bug 暴露到了用户可见层（明细 Sheet 「到场差异」列全部 0）。**未在本次导出功能内修复**，避免 commit 失焦；列入下一轮 `M2-技术债清理` 专项。 | 用户误以为到场率 100% 是真实的 | 下一轮在 `utils/index.ts:parseTimestamp` 内做兼容：若结果 NaN 则回退到 `new Date(input.replace(' ', 'T'))` |

---

## 7. 后续规划（不在本增量）

| # | 计划 | 触发条件 |
|---|------|---------|
| 1 | **后端流式导出**（CSV / xlsx） | 调车单 > 1 万行 或 用户反馈导出慢 |
| 2 | **PDF 导出** | HR 提出打印月报诉求 |
| 3 | **导出历史记录** | 多角色共享导出文件、需审计 |
| 4 | **邮件发送** | 自动发给钉钉群 / 邮件订阅 |
| 5 | **M2 PRD 全量补齐**（含调度时效分析页本身） | 当前 PRD 缺口见 §0 警告 |

---

## 8. 工时统计(原 M2 增量 1 导出功能)

| 步骤 | 工时（人天） |
|------|:---:|
| 需求澄清 + 决策挑战 | 0.1 |
| 写 excelExport 工具（含 4 Sheet + 格式化）| 0.3 |
| Page 端集成（按钮 + lookup + handleExport） | 0.1 |
| 补 PRD 本文档 | 0.1 |
| **合计** | **0.6 人天** |

---

## 9. M2.4 增量(2026-07-14):5 漏斗计数 + 园区对比柱状图

### 9.1 背景与目标

**问题**:v0.5.0-M2.2 仅有 3 比率卡(及时到场率 / 及时装货完成率 / 及时到货率),无法回答:
- "今天有多少辆车需求到场?" → 缺绝对数
- "秦壁 vs 甘亭 哪个园区表现好?" → 缺可视化对比
- "本周装完了多少辆?" → 缺漏斗快照

**目标**:在 3 比率卡基础上,新增 5 个绝对数漏斗 + 1 套按园区拆分的 ECharts 对比图。

### 9.2 新增功能

#### 9.2.1 5 漏斗计数卡(车辆总数)

| 卡片 | 判定字段 | 计数口径 |
|------|----------|----------|
| 需求到场 | `dispatch.expectedLoadTime` | 在筛选范围内的车辆总数 |
| 实际到场 | 任一 `YardTimeline.queuedAt` | 在筛选范围内的车辆总数 |
| 已装完 | 任一 `YardTimeline.loadingCompletedAt` | 在筛选范围内的车辆总数 |
| 已出场 | 任一 `YardTimeline.leftAt` | 在筛选范围内的车辆总数 |
| 已到货 | 任一 `YardTimeline.driverConfirmedAt` | 在筛选范围内的车辆总数 |

**业务语义**:每辆车最多计 1 次(任一 YardTimeline 命中即计入)。

**配色梯度**(匹配漏斗推进):紫 → 蓝 → 青 → 绿 → 橙。

**公式文案**:严格按用户原话,不做语义重写(如"需求时间在目标时间内车辆总数")。

#### 9.2.2 园区时效对比柱状图(ECharts 5)

- **拆分图设计**:1 园区 1 独立 Chart,横排并排(用户反馈优化)
- **每图 X 轴**:4 指标(需求到场 / 按时到场 / 及时装货完成 / 按时到货)
- **每图 Series**:1 个(单一园区数据)
- **柱顶 label**:`数量\n(占比%)`,0 值不显示
- **占比分母按各 metric 语义**:
  - 需求到场 = 100%(自身即分母)
  - 按时到场 / 及时装货完成 / 按时到货 = 该值 / 该 yard 的 expected
- **轴标题**:X 轴「业务指标」/ Y 轴「车辆数(辆)」(12px 灰字)
- **配色**:秦壁蓝 `#1677ff` / 甘亭紫 `#722ed1`(沿用 M2.4 v2 配色)
- **空数据回退**:`<Empty>` 占位

#### 9.2.3 Excel 导出扩展(4 Sheet → 6 Sheet)

| Sheet | 名称 | 内容 |
|-------|------|------|
| 1 | 调车单明细 | (v0.5.0 不变) |
| 2 | 按公司 | (v0.5.0 不变) |
| 3 | 按装货园区 | (v0.5.0 不变) |
| 4 | 按运输方向 | (v0.5.0 不变) |
| **5** | **漏斗计数** | 5 行 × 4 列(排名/指标/当前计数/公式) |
| **6** | **园区对比** | N 行 × 5 列(园区/需求到场数/按时到场数/及时装货完成数/按时到货数) |

文件名不变:`调度时效分析_YYYYMMDD_HHmm.xlsx`

### 9.3 技术决策

| 决策点 | 方案 | 原因 |
|--------|------|------|
| 图表库 | echarts 5 + echarts-for-react v3 | tree-shake 后 ~200KB gzipped;社区主流 |
| import 方式 | tree-shaken(BarChart + 4 components + CanvasRenderer) | 避免 ~900KB 全量 |
| 轴向 | X = 4 指标,Series = 2 园区 | 用户反馈:指标直接显示在 X 轴更直观 |
| 拆分图 vs 大图 | 1 园区 1 Chart 拆分 | 用户反馈:大图标签拥挤,拆分更清晰 |
| 占比分母 | 各 metric 自己的语义 | 业务口径最准 |
| Sheet 5/6 vs 加列 | 独立 Sheet | 现有 Sheet 是「率」语义,新数据是「绝对数」语义 |
| dayjs plugin | 显式 extend `isBetween` | dayjs 不默认包含,需手动加载 |

### 9.4 工时统计(M2.4)

| 步骤 | 工时(人天) |
|------|:---:|
| 需求澄清 + 决策挑战(4 轮 AskUserQuestion) | 0.3 |
| 写 utils 5 calc + buildYardComparisonRows + dayjs 修复 | 1.0 |
| FunnelCountCards 组件 + Page Row 2 接入 | 1.0 |
| YardComparisonChart 组件(v1 → v2 轴向互换 → v3 拆分 → 轴标题) | 1.5 |
| Excel 导出扩展(ExportParams + Sheet 5/6) | 0.5 |
| CHANGELOG + PRD 同步 | 0.2 |
| **合计** | **4.5 人天** |

### 9.5 验收记录

- 2026-07-14 用户验收通过(`6550a36` v3 拆分图 + 轴标题后)
- 决策挑战:用户原话"5 个指标描述完全相同是复制粘贴错误吗"→ AI 主动质疑,获得澄清:"实际到场 = 排队时间在目标时间内"
- 决策挑战:"3+5 怎么布局"→ 推荐 3+5 分两行排
- 决策挑战:"图表类型"→ 用户选分组柱状图 → 后续反馈改拆分图(2 轮迭代)

### 9.6 已知限制

- **Mock 数据稀疏**:`driverConfirmedAt` 仅 3/18 条 mock 有,「已到货」柱常显示低值或 0 — 演示数据限制
- **多园区调车单 per-yard 计数**:1 张 dispatch 含多园区时,会按园区重复计入 — Tooltip 已标注"每园区独立计数"

---

## 10. M2.5+M2.6+M2.7 增量(2026-07-14):按园区月度透视 + 按公司×方向透视 + Excel 6 Sheet 对齐

### 10.1 背景与目标

**业务动机**(3 个连续迭代):
1. **M2.5**:原「按装货园区」Tab 只有全期汇总,无法回答"2026 年 6 月秦壁园区的 4 小时装货达成率是多少" — 补齐时间维度
2. **M2.6**:原「按公司」和「按运输方向」Tab 是两个独立聚合视角,业务方需要交叉维度(某公司在某方向的达成情况)只能人工 join — 合并为 (公司 × 方向) 二维透视表
3. **M2.7**:Excel 导出 Sheet 与 UI Tab 内容不一致(UI 看透视表、Excel 看聚合表) — 同步对齐

**目标**:在 M2.4(3 比率 + 5 漏斗 + 图表)基础上,新增 2 个透视表(按园区月度 + 按公司方向),Excel 6 Sheet 与 UI Tab 1:1 对齐。

### 10.2 新增功能

#### 10.2.1 按装货园区月度透视表(M2.5)

| 项目 | 设计 |
|------|------|
| 组件 | `YardMonthlyPivot.tsx` |
| 列数 | 7 |
| 列字段 | 园区(合并) / 月份 / 调车需求(辆) / 未按时到场(辆) / 及时到场率 / 未达成4小时装货(辆) / 4小时装货达成率 |
| 排序 | yardName 字典序 → monthLabel 倒序 |
| 比率列 Tag | `>= 80` 绿 / `< 80` 红 |
| 防空显示 | `demand=0` 时比率列显示 `-`(替代 `#DIV/0!`) |
| utils | `buildYardMonthlyRows({ dispatches, analyses, yards })` |

#### 10.2.2 按公司×方向透视表(M2.6)

| 项目 | 设计 |
|------|------|
| 组件 | `CompanyDirectionPivot.tsx` |
| 列数 | 8 |
| 列字段 | 物流公司 / 路线 / 时效要求 / 应到数量 / 需求到场车辆 / 按时到场车辆 / 及时装货完成车辆 / 按时到货车辆 |
| 合并 | 公司 rowSpan(同公司多方向合并) |
| 排序 | companyName 字典序 → direction 字典序 |
| 数据语义 | 全部为车辆绝对数(无数值比率)— 与用户截图样式一致 |
| utils | `buildCompanyDirectionRows({ dispatches, analyses, companies })` |

**字段语义对齐**(业务方原话):
- `assigned`(应到数量)= 被派车辆(`status >= dispatched`)
- `planned`(需求到场车辆)= `expectedLoadTime ∈ 筛选时间范围`
- `onTimeArrival`(按时到场车辆)= `isOnTimeArrival === true`(30 分钟内)
- `onTimeLoading`(及时装货完成车辆)= `per YardTimeline, effectiveLoadMin ≤ 4h`
- `onTimeDelivery`(按时到货车辆)= `isOnTimeDelivery === true`(≤ SLA)

#### 10.2.3 Tab 调整

| Tab | M2.4 | M2.5 | M2.6 | M2.7 |
|-----|------|------|------|------|
| 调车单明细 | ✅ | ✅ | ✅ | ✅ |
| 按公司 | 聚合表 | 聚合表 | **透视表** | **透视表** |
| 按装货园区 | 全期汇总 | **月度透视(默认)+ 全期汇总** | ✅ | ✅ |
| 按运输方向 | 排名榜 | ✅ | **❌ 移除(并入按公司)** | ❌ 移除 |

**Tab 总数**:4 → 3(M2.6 移除「按运输方向」)

#### 10.2.4 Excel 6 Sheet 新结构(M2.7)

| # | Sheet 名 | 列数 | 数据源 | 对应 UI Tab |
|:-:|---------|:-:|------|----------|
| 1 | 调车单明细 | 12 | `analyses` | 调车单明细 Tab |
| 2 | **按公司×方向透视** | **8** | `companyDirectionRows` ← 新 | 按公司 Tab |
| 3 | **按装货园区月度透视** | **7** | `yardMonthlyRows` ← 新 | 按装货园区 Tab 上半 |
| 4 | **按装货园区全期汇总** | 5 | `groupedByYard` | 按装货园区 Tab 下半 |
| 5 | 漏斗计数 | 4 | `funnelCounts` | 顶部 5 漏斗卡 |
| 6 | 园区对比 | 5 | `yardChartRows` | 柱状图 |

**删除**:旧 Sheet「按运输方向」(Tab 已废弃)

### 10.3 关键决策(7 项已对齐)

| # | 决策点 | 选择 | 理由 |
|---|--------|------|------|
| 1 | M2.5 表格形态 | 月度透视表(7 列) | 用户截图样式对齐 + 时间维度下钻 |
| 2 | M2.5 排序 | yardName 字典序 → monthLabel 倒序 | 最新月份优先展示 |
| 3 | M2.5 4 小时定义 | 沿用 M2.4 卡片定义 | 全产品口径统一 |
| 4 | M2.6 表格形态 | 扁平透视表(8 列,合并公司) | 用户截图样式对齐 |
| 5 | M2.6 Tab 合并 | 合并(移除按方向 Tab) | 透视表已涵盖 (公司 × 方向) 二维信息 |
| 6 | M2.7 Sheet 形态 | 完全镜像 UI Tab(6 Sheet) | UI/Excel 一致性,降低业务方认知成本 |
| 7 | M2.7 旧 Sheet 处理 | 删除(不保留 deprecated) | Tab 已移除,Sheet 保留无意义 |

### 10.4 验收标准(AC)

#### M2.5 AC

- [x] 「按装货园区」Tab 默认位显示月度透视表(7 列)
- [x] 园区列按 rowSpan 合并
- [x] 月份倒序展示(最新月份在最上)
- [x] 比率列 Tag 着色(>= 80 绿 / < 80 红)
- [x] demand=0 时显示 `-` 不报错

#### M2.6 AC

- [x] 「按公司」Tab 显示 8 列透视表
- [x] 公司列按 rowSpan 合并
- [x] 「按运输方向」Tab 已移除
- [x] 字段语义对齐业务方原话(应到数量/需求到场车辆/按时到场车辆/及时装货完成车辆/按时到货车辆)

#### M2.7 AC

- [x] Excel 导出 6 Sheet,Sheet 名与 UI Tab 一致
- [x] Sheet 2「按公司×方向透视」8 列与 UI 一致
- [x] Sheet 3「按装货园区月度透视」7 列与 UI 一致
- [x] Sheet 4「按装货园区全期汇总」5 列与 UI 一致
- [x] 旧 Sheet「按运输方向」已删除

### 10.5 技术决策

#### M2.5 + M2.6 utils 层

- **新函数**:`buildYardMonthlyRows`(3 入参)/ `buildCompanyDirectionRows`(3 入参)
- **关键修复**:`import { Company } from '@/types/dispatch'` + `dayjs.extend(isBetween)`
- **聚合模式**:Map 二维 group → sort → flat(复用 M2.4 模式)

#### M2.7 excelExport.ts 重构

- **`ExportParams` 字段调整**:
  - ➕ `companyDirectionRows: CompanyDirectionRow[]`(Sheet 2)
  - ➕ `yardMonthlyRows: YardMonthlyRow[]`(Sheet 3)
  - ➖ 移除 `groupedByCompany`(已废弃)
  - ➖ 移除 `groupedByDirection`(已废弃)
  - 保留 `groupedByYard`(Sheet 4 + Tab 全期汇总)
- **`Page.handleExport` 调整**:传入新字段 + 删除旧字段
- **`Page` useMemo 清理**:删除 `groupedByCompany` + `groupedByDirection`

### 10.6 已知限制与修复

#### 已知限制

- **Mock 数据稀疏**:mock 仅覆盖 2026-06~07 月份,演示时月度数据有限 — 真实数据无此问题
- **M2.6 字段重命名**:原 `按公司` Tab 的 6 列拆为 8 列后,Excel 旧数据无对应 — 一次性迁移,无向后兼容需求

#### 本里程碑内 fixup 修复

| Commit | 现象 | 根因 | 修复 |
|--------|------|------|------|
| `0e22404` fixup #1 | `Syntax error "\u{5c0f}"` dev server 500 | esbuild 严格遵循 ES2015:`{ 4小时装货达成率: 1 }` 中 "4" 不是 ID_Start 字符 | 加引号改为字符串 key `{ '4小时装货达成率': 1 }` |
| `0e22404` fixup #2 | `ReferenceError: Can't find variable: DIRECTION_DELIVERY_SLA_HOURS` | `excelExport.ts` 顶部 import 区只 `import type`,无运行时常量 import;re-export 不会让本文件内部引用 | 顶部 `import { DIRECTION_DELIVERY_SLA_HOURS, ON_TIME_DELIVERY_DEFAULT_HOURS } from '@/types/dispatch'` |

**Why 这 2 个 fixup 不占独立 slot**:都属 M2.7 单一交付意图的子修复,且 M2.7 验收前已通过 git fixup + autosquash 合并回主 commit。

---

*最后更新: 2026-07-14 — 来源: M2.5 + M2.6 + M2.7 调度时效分析透视化与导出对齐*

*最后更新: 2026-07-14 — 来源: M2.4 调度时效可视化升级需求*