/**
 * 调度时效分析工具（M2）
 *
 * 业务规则（来自需求）：
 *  1. 排队与要求差异 = queuedAt - expectedLoadTime（多园区只算 primaryYardId）
 *  2. 装车耗时 = loadingCompletedAt - enteredAt（含禁行时段）
 *  3. 装货用时 = effectiveLoadMin = 装车耗时 - 禁行时段
 *     时间1：
 *       ① 进入时刻 ≤ expectedLoadTime → time1 = expectedLoadTime
 *       ② 进入时刻 > expectedLoadTime → time1 = queuedAt
 *       ③ 多园区第 2 园区起 → time1 = queuedAt
 *  4. 是否超时 = standardMin(4h) - effectiveLoadMin
 *  5. 超时原因（静态预设 + 多选）
 *  6. 超时责任部门（静态预设 + 单选）
 *  7. 出厂时间 fallback：leftAt → loadingCompletedAt + 2h
 *  8. 最终出厂时间：多园区取最后园区 leftAt
 */

import type { Dispatch, YardTimeline, DispatchEfficiency, YardEfficiency, Yard } from '@/types/dispatch'
import {
  calcRestrictedMinutes,
  STANDARD_LOAD_MIN,
} from './restrictedHours'
import { nowIsoString, parseTimestamp } from './index'
import {
  ON_TIME_ARRIVAL_TOLERANCE_MIN,
  ON_TIME_DELIVERY_DEFAULT_HOURS,
  DIRECTION_DELIVERY_SLA_HOURS,
} from '@/types/dispatch'
import dayjs, { type Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

/** 比率结果三元组：分子 / 分母 / 百分比 */
export interface RateTriple {
  /** 百分比，0-100，无小数 */
  rate: number
  /** 分子（满足条件的数量） */
  numerator: number
  /** 分母（参与统计的总数） */
  denominator: number
}

/**
 * 计算两个时间戳相差的分钟数（精确到分钟）
 */
function diffMinutes(later: string, earlier: string): number {
  const a = parseTimestamp(later)?.getTime()
  const b = parseTimestamp(earlier)?.getTime()
  if (!a || !b) return 0
  return Math.max(0, Math.round((a - b) / 60000))
}

/** 加上分钟数，返回本地格式字符串 */
function addMinutes(base: string, mins: number): string {
  const d = parseTimestamp(base)
  if (!d) return base
  d.setMinutes(d.getMinutes() + mins)
  return nowIsoString(d)
}

/**
 * 推断超时原因（M2 mock 静态预设）
 *
 * 简单的规则：基于排队差异和装车耗时给出 1-2 个可能原因
 */
function inferOvertimeReasons(input: {
  queueDiffMin: number
  effectiveLoadMin: number
  standardMin: number
}): string[] {
  const reasons: string[] = []
  if (input.queueDiffMin > 30) reasons.push('customer_delay') // 客户延迟 > 30 min
  if (input.effectiveLoadMin > input.standardMin + 60) reasons.push('slow_loading') // 超时 > 1h 视为装货慢
  if (input.queueDiffMin > 60) reasons.push('yard_congestion') // 排队 > 60 min 视为园区拥堵
  if (reasons.length === 0) reasons.push('other')
  return reasons
}

/**
 * 推断超时责任部门（M2 mock 静态预设）
 */
function inferOvertimeDepartment(input: {
  queueDiffMin: number
  effectiveLoadMin: number
  standardMin: number
}): string {
  if (input.queueDiffMin > 60) return 'warehouse'
  if (input.effectiveLoadMin > input.standardMin + 90) return 'warehouse'
  if (input.queueDiffMin > 0 && input.queueDiffMin <= 60) return 'customer'
  return 'driver'
}

/**
 * 分析单园区调度时效
 */
export function analyzeYardEfficiency(
  dispatch: Dispatch,
  yardIndex: number,
  yard: YardTimeline,
): YardEfficiency | null {
  const {
    queuedAt,
    enteredAt,
    loadingCompletedAt,
    leftAt,
  } = yard

  if (!queuedAt || !enteredAt || !loadingCompletedAt) {
    return null // 时间戳不全，无法分析
  }

  const { expectedLoadTime } = dispatch
  const isFirstYard = yardIndex === 0

  // 规则 1：排队与要求差异 = queuedAt - expectedLoadTime
  const queueDiffMin = expectedLoadTime ? diffMinutes(queuedAt, expectedLoadTime) : 0

  // 规则 2：装车耗时（原始差值，含禁行时段）
  const enterToLoadRawMin = diffMinutes(loadingCompletedAt, enteredAt)

  // 计算禁行时段
  const restrictedMin = calcRestrictedMinutes(enteredAt, loadingCompletedAt)

  // 规则 3：装货用时 = enterToLoadRawMin - restrictedMin
  const effectiveLoadMin = enterToLoadRawMin - restrictedMin

  // 规则 4：是否超时
  const isOvertime = effectiveLoadMin > STANDARD_LOAD_MIN
  const overtimeMin = isOvertime ? effectiveLoadMin - STANDARD_LOAD_MIN : 0

  // 规则 5/6：超时原因 + 责任部门（仅超时）
  const overtimeReasons = isOvertime
    ? inferOvertimeReasons({ queueDiffMin, effectiveLoadMin, standardMin: STANDARD_LOAD_MIN })
    : []
  const overtimeDepartment = isOvertime
    ? inferOvertimeDepartment({ queueDiffMin, effectiveLoadMin, standardMin: STANDARD_LOAD_MIN })
    : undefined

  // 规则 7：出厂时间 fallback
  const factoryOutTime = leftAt || addMinutes(loadingCompletedAt, 120)

  return {
    yardId: yard.yardId,
    yardName: yard.yardName,
    queueDiffMin,
    enterToLoadRawMin,
    restrictedMin,
    effectiveLoadMin,
    standardMin: STANDARD_LOAD_MIN,
    isOvertime,
    overtimeMin,
    overtimeReasons,
    overtimeDepartment,
    factoryOutTime,
    isFirstYard,
  }
}

/**
 * 分析整张调车单的调度时效
 */
export function analyzeDispatchEfficiency(dispatch: Dispatch): DispatchEfficiency | null {
  const timelines = dispatch.yardTimelines || []
  const yardMetrics: YardEfficiency[] = []

  for (let i = 0; i < timelines.length; i++) {
    const m = analyzeYardEfficiency(dispatch, i, timelines[i])
    if (m) yardMetrics.push(m)
  }

  if (yardMetrics.length === 0) return null

  const totalEffectiveLoadMin = yardMetrics.reduce((sum, m) => sum + m.effectiveLoadMin, 0)
  const totalOvertimeMin = yardMetrics.reduce((sum, m) => sum + m.overtimeMin, 0)
  const isOvertime = yardMetrics.some((m) => m.isOvertime)

  // 规则 8：最终出厂时间 = 多园区最后园区 leftAt
  const lastYard = timelines[timelines.length - 1]
  const finalExitTime = lastYard?.leftAt

  // —— v0.2.0-M2：及时到场 + 及时到货 ——
  // 及时到场 = 主园区 enteredAt 与 expectedLoadTime 偏差 ≤ ON_TIME_ARRIVAL_TOLERANCE_MIN
  const primaryYard = timelines[0]
  const arrivalDiffMin = primaryYard?.enteredAt
    ? diffMinutes(primaryYard.enteredAt, dispatch.expectedLoadTime)
    : undefined
  const isOnTimeArrival =
    arrivalDiffMin !== undefined && arrivalDiffMin <= ON_TIME_ARRIVAL_TOLERANCE_MIN

  // 及时到货 = signedAt 与 expectedLoadTime 间隔 ≤ direction SLA
  // 注：直接 inline 'YYYY-MM-DD HH:mm:ss' → ISO，避免 parseTimestamp 内部
  //     replace('-','/').replace(' ','T') 在 Chrome 下产出 NaN 的已知问题
  const signedAt = timelines
    .map((y) => y.signedAt)
    .filter((v): v is string => Boolean(v))
    .reduce<string | undefined>(
      (max, v) => (max === undefined || v > max ? v : max),
      undefined,
    )
  let deliveryHours: number | undefined
  let isOnTimeDelivery: boolean | undefined
  if (signedAt && dispatch.expectedLoadTime) {
    const a = new Date(signedAt.replace(' ', 'T')).getTime()
    const b = new Date(dispatch.expectedLoadTime.replace(' ', 'T')).getTime()
    if (Number.isFinite(a) && Number.isFinite(b) && a >= b) {
      deliveryHours = Math.round(((a - b) / 3600000) * 10) / 10 // 1 位小数
      const sla =
        DIRECTION_DELIVERY_SLA_HOURS[dispatch.direction] ??
        ON_TIME_DELIVERY_DEFAULT_HOURS
      isOnTimeDelivery = deliveryHours <= sla
    }
  }

  return {
    dispatchId: dispatch.id,
    dispatchNo: dispatch.dispatchNo,
    companyId: dispatch.companyId,
    companyName: dispatch.companyName,
    vehicleNo: dispatch.vehicleNo || '',
    driverName: dispatch.driverName || '',
    yardCount: yardMetrics.length,
    yards: yardMetrics,
    totalEffectiveLoadMin,
    totalOvertimeMin,
    isOvertime,
    finalExitTime,
    generatedAt: nowIsoString(),
    arrivalDiffMin,
    isOnTimeArrival,
    signedAt,
    deliveryHours,
    isOnTimeDelivery,
    direction: dispatch.direction,
    shippingMethod: dispatch.shippingMethod,
    yardIds: dispatch.yardIds || [],
  }
}

/** 格式化分钟数为 "Xh Ym" */
export function formatMinutesAsHour(min: number): string {
  if (min <= 0) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ============================================================================
// 调度时效指标改造（2026-07-13 · M2 v0.4.0）
// ----------------------------------------------------------------------------
// 新增 3 个独立 calc 函数：及时到场率 / 及时装货完成率 / 及时到货率
//  - 数据源：filteredDispatches（所有被派车辆，含未到场/未到货的）
//  - 装货完成率分母以 YardTimeline 为单位（B2 关键，多园区调车单每个园区独立计数）
// ============================================================================

/** 「已被派车」的状态集合（>= dispatched，纳入到场/到货率分母） */
const DISPATCHED_OR_BEYOND_STATUSES = [
  'dispatched',
  'queued',
  'entering',
  'loading',
  'leaving',
  'in_transit',
  'driver_confirmed',
  'completed',
] as const

/** 判断调车单是否已被派车（内部 helper，不导出） */
function isDispatchedOrBeyond(d: Dispatch): boolean {
  return (DISPATCHED_OR_BEYOND_STATUSES as readonly string[]).includes(d.status)
}

/**
 * 及时到场率 = 按时到场车辆数 / 所有被派车辆数
 *  - 分子：analyzeDispatchEfficiency(d).isOnTimeArrival === true
 *  - 分母：status >= dispatched（含未到场的 queued 等）
 */
export function calcOnTimeArrivalRate(dispatches: Dispatch[]): RateTriple {
  const dispatched = dispatches.filter(isDispatchedOrBeyond)
  const denominator = dispatched.length
  const numerator = dispatched.filter((d) => {
    // 不依赖 analyzeDispatchEfficiency（其在 yardMetrics 为空时返回 null，
    // 会让"已入场但未装货完成"的车辆被错误排除在分子之外）。
    // 直接基于 primaryYardId 找到主园区，用 YardTimeline.enteredAt 与 expectedLoadTime 计算。
    const primaryYard = (d.yardTimelines || []).find((y) => y.yardId === d.primaryYardId)
    if (!primaryYard?.enteredAt || !d.expectedLoadTime) return false
    const diffMin = Math.round(
      (new Date(primaryYard.enteredAt.replace(' ', 'T')).getTime() -
       new Date(d.expectedLoadTime.replace(' ', 'T')).getTime()) / 60000,
    )
    return diffMin <= ON_TIME_ARRIVAL_TOLERANCE_MIN
  }).length
  return {
    rate: denominator > 0 ? Math.round((numerator / denominator) * 100) : 0,
    numerator,
    denominator,
  }
}

/**
 * 及时装货完成率（标准 4 小时）= 装货<4h 的园区数 / 已装货完成的所有园区数
 *  - 关键（B2）：以 YardTimeline 为单位；多园区调车单每个园区独立计数
 *  - 装货用时 = loadingCompletedAt - enteredAt（分钟）
 *  - 分母：所有 loadingCompletedAt 存在的 YardTimeline
 *  - 分子：装货用时 ≤ STANDARD_LOAD_MIN 的 YardTimeline
 */
export function calcOnTimeLoadingRate(dispatches: Dispatch[]): RateTriple {
  let numerator = 0
  let denominator = 0
  for (const d of dispatches) {
    for (const y of d.yardTimelines || []) {
      // 进入/装货完成缺失则不计入（无法计算装货用时）
      if (!y.loadingCompletedAt || !y.enteredAt) continue
      denominator++
      const completedMs = new Date(y.loadingCompletedAt.replace(' ', 'T')).getTime()
      const enteredMs = new Date(y.enteredAt.replace(' ', 'T')).getTime()
      const loadMin = Math.max(0, Math.round((completedMs - enteredMs) / 60000))
      if (loadMin <= STANDARD_LOAD_MIN) numerator++
    }
  }
  return {
    rate: denominator > 0 ? Math.round((numerator / denominator) * 100) : 0,
    numerator,
    denominator,
  }
}

/**
 * 及时到货率 = 及时到货的车辆数 / 所有被派车辆数
 *  - 分子：analyzeDispatchEfficiency(d).isOnTimeDelivery === true
 *  - 分母：status >= dispatched（含未到货的 in_transit / driver_confirmed 等）
 */
export function calcOnTimeDeliveryRate(dispatches: Dispatch[]): RateTriple {
  const dispatched = dispatches.filter(isDispatchedOrBeyond)
  const denominator = dispatched.length
  const numerator = dispatched.filter((d) => {
    // 不依赖 analyzeDispatchEfficiency（其依赖 signedAt 旧字段，且在 yardMetrics 为空时返回 null）。
    // 直接基于 YardTimeline.driverConfirmedAt / leftAt 计算到货耗时，与 direction SLA 比较。
    const confirmedYard = (d.yardTimelines || []).find((y) => y.driverConfirmedAt)
    if (!confirmedYard?.driverConfirmedAt || !confirmedYard.leftAt) return false
    const hours =
      (new Date(confirmedYard.driverConfirmedAt.replace(' ', 'T')).getTime() -
       new Date(confirmedYard.leftAt.replace(' ', 'T')).getTime()) / 3600000
    const sla =
      DIRECTION_DELIVERY_SLA_HOURS[d.direction] ?? ON_TIME_DELIVERY_DEFAULT_HOURS
    return hours <= sla
  }).length
  return {
    rate: denominator > 0 ? Math.round((numerator / denominator) * 100) : 0,
    numerator,
    denominator,
  }
}

// ============================================================================
// 调度时效漏斗计数 + 园区对比聚合（M2.4 v0.6.0 · 2026-07-14）
// ----------------------------------------------------------------------------
// 5 个绝对数漏斗指标（卡片）+ 园区对比矩阵（图表）
//  - 数据源：filteredDispatches（按 5 维筛选后的全部车辆）
//  - 时间字段：expectedLoadTime / queuedAt / loadingCompletedAt / leftAt / driverConfirmedAt
//  - "在筛选范围内" = dayjs(ts).isBetween(from, to, 'minute', '[]')
//  - Safari 兼容：与 .replace(' ', 'T') 模式保持一致
// ============================================================================

/** 5 漏斗节点的计数结果（每辆车最多计 1 次，符合"车辆总数"语义） */
export interface FunnelCounts {
  /** 需求到场数：dispatch.expectedLoadTime ∈ 筛选范围 */
  expected: number
  /** 实际到场数：任一 YardTimeline.queuedAt ∈ 筛选范围 */
  arrived: number
  /** 已装完数：任一 YardTimeline.loadingCompletedAt ∈ 筛选范围 */
  loaded: number
  /** 已出场数：任一 YardTimeline.leftAt ∈ 筛选范围 */
  exited: number
  /** 已到货数：任一 YardTimeline.driverConfirmedAt ∈ 筛选范围 */
  delivered: number
}

/** 时间戳 ∈ 筛选范围（含端点，按分钟精度） */
function inFilterRange(ts: string | undefined, range: [Dayjs, Dayjs]): boolean {
  if (!ts) return false
  const t = dayjs(ts.replace(' ', 'T'))
  return t.isValid() && t.isBetween(range[0], range[1], 'minute', '[]')
}

/** 取 dispatch 第一个匹配时间字段的非空值（任一园区任一非空时间戳） */
function pickFirstYardTimestamp(
  dispatch: Dispatch,
  field: 'queuedAt' | 'loadingCompletedAt' | 'leftAt' | 'driverConfirmedAt',
): string | undefined {
  for (const y of dispatch.yardTimelines || []) {
    const ts = y[field]
    if (ts) return ts
  }
  return undefined
}

/** 5 个独立计数函数（语义上"车辆总数"，按 dispatch 唯一计数） */
export function calcExpectedArrivalCount(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): number {
  return dispatches.filter((d) => inFilterRange(d.expectedLoadTime, range)).length
}

export function calcActualArrivalCount(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): number {
  return dispatches.filter((d) =>
    inFilterRange(pickFirstYardTimestamp(d, 'queuedAt'), range),
  ).length
}

export function calcLoadedCount(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): number {
  return dispatches.filter((d) =>
    inFilterRange(pickFirstYardTimestamp(d, 'loadingCompletedAt'), range),
  ).length
}

export function calcExitedCount(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): number {
  return dispatches.filter((d) =>
    inFilterRange(pickFirstYardTimestamp(d, 'leftAt'), range),
  ).length
}

export function calcDeliveredCount(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): number {
  return dispatches.filter((d) =>
    inFilterRange(pickFirstYardTimestamp(d, 'driverConfirmedAt'), range),
  ).length
}

/** 5 漏斗计数合并 helper（Page 端单次 useMemo 调用即可） */
export function calcFunnelCounts(
  dispatches: Dispatch[],
  range: [Dayjs, Dayjs],
): FunnelCounts {
  return {
    expected: calcExpectedArrivalCount(dispatches, range),
    arrived: calcActualArrivalCount(dispatches, range),
    loaded: calcLoadedCount(dispatches, range),
    exited: calcExitedCount(dispatches, range),
    delivered: calcDeliveredCount(dispatches, range),
  }
}

// ---------- 园区对比聚合 ----------

/** 园区对比图 / Sheet 单行结构 */
export interface YardComparisonRow {
  yardId: string
  yardName: string
  /** 需求到场数：per-yard（多园区调车单每个园区各计 1） */
  expected: number
  /** 按时到场数：per-dispatch（任一 yardId 匹配） */
  onTimeArrival: number
  /** 及时装货完成数：per-YardTimeline */
  onTimeLoading: number
  /** 按时到货数：per-dispatch（任一 yardId 匹配） */
  onTimeDelivery: number
}

/**
 * 按 yard 聚合 4 系列计数（图表 + Sheet 6 共用）。
 * 数据源：
 *  - expected：dispatches（含未完成的）+ yardIds.includes(yardId)
 *  - onTimeArrival / onTimeDelivery：analyses（已完成,任一 yardId 匹配）
 *  - onTimeLoading：analyses[].yards[].effectiveLoadMin ≤ STANDARD_LOAD_MIN 的 YardTimeline
 *
 * 注意：dispatches 入参应是 Page 端已按 5 维筛选的 filteredDispatches，
 *      analyses 入参应是 status=completed 的子集。
 */
export function buildYardComparisonRows(input: {
  dispatches: Dispatch[]
  analyses: DispatchEfficiency[]
  yards: Yard[]
}): YardComparisonRow[] {
  return input.yards.map((yard) => {
    const yardId = yard.id

    // expected：所有包含该 yard 的被派车辆
    const expected = input.dispatches.filter(
      (d) => !!d.expectedLoadTime && (d.yardIds || []).includes(yardId),
    ).length

    // onTimeArrival：已完成 + yardIds 包含该 yard + 入场偏差 ≤ 30min
    const onTimeArrival = input.analyses.filter((a) => {
      if (!a.yardIds.includes(yardId)) return false
      if (a.arrivalDiffMin === undefined) return false
      return a.arrivalDiffMin <= ON_TIME_ARRIVAL_TOLERANCE_MIN
    }).length

    // onTimeLoading：per-YardTimeline（与 calcOnTimeLoadingRate 口径一致）
    let onTimeLoading = 0
    for (const a of input.analyses) {
      for (const y of a.yards || []) {
        if (y.yardId !== yardId) continue
        if (y.effectiveLoadMin <= STANDARD_LOAD_MIN) onTimeLoading++
      }
    }

    // onTimeDelivery：已完成 + yardIds 包含该 yard + 到货及时
    const onTimeDelivery = input.analyses.filter((a) => {
      if (!a.yardIds.includes(yardId)) return false
      return a.isOnTimeDelivery === true
    }).length

    return {
      yardId,
      yardName: yard.name,
      expected,
      onTimeArrival,
      onTimeLoading,
      onTimeDelivery,
    }
  })
}

// ============================================================================
// 按园区 × 月度 透视表聚合（M2.5 · 2026-07-14）
// ----------------------------------------------------------------------------
// 业务口径（用户 4 轮决策后定稿）：
//  - 月份归属：dispatch.expectedLoadTime ∈ 该月（业务计划口径）
//  - 调车需求：月份内的 dispatch 计数（分母）
//  - 未按时到场：enteredAt - expectedLoadTime > ON_TIME_ARRIVAL_TOLERANCE_MIN
//  - 未达成4小时装货：YardTimeline.effectiveLoadMin > STANDARD_LOAD_MIN
//  - 比率：分子分母同月份；分母=0 时显示 "-" 而非 #DIV/0!
// ============================================================================

/** 透视表单行结构（园区 + 月份 + 5 指标） */
export interface YardMonthlyRow {
  yardId: string
  yardName: string
  /** 月份标签，格式 YYYY-MM（如 "2026-07"） */
  monthLabel: string
  /** 月份起始时间（Dayjs 截断到月初） */
  monthStart: Dayjs
  /** 调车需求（辆）：该月 expectedLoadTime 的 dispatch 计数 */
  demand: number
  /** 未按时到场（辆）：enteredAt - expectedLoadTime > 30min */
  lateArrival: number
  /** 及时到场率（%）：1 - lateArrival/demand × 100，demand=0 时为 null */
  arrivalRate: number | null
  /** 未达成4小时装货（辆）：YardTimeline.effectiveLoadMin > 4h */
  lateLoading: number
  /** 4小时装货达成率（%）：1 - lateLoading/demand × 100，demand=0 时为 null */
  loadingRate: number | null
}

/**
 * 按园区 × 月度聚合透视表数据。
 * 排序：先 yardName 字典序，再 monthLabel 倒序（最新月在上）。
 *
 * 数据源：
 *  - dispatches: filteredDispatches（5 维筛选后的全部车辆）
 *  - analyses: status=completed 子集（用于取 effectiveLoadMin）
 *  - yards: yard 字典
 */
export function buildYardMonthlyRows(input: {
  dispatches: Dispatch[]
  analyses: DispatchEfficiency[]
  yards: Yard[]
}): YardMonthlyRow[] {
  // 用 analysisById 索引，便于查 effectiveLoadMin
  const analysisById = new Map<string, DispatchEfficiency>()
  for (const a of input.analyses) analysisById.set(a.dispatchId, a)

  // 月份集合（每个园区各自独立的月份桶）
  const buckets = new Map<
    string,
    {
      yardId: string
      yardName: string
      monthLabel: string
      monthStart: Dayjs
      demand: number
      lateArrival: number
      lateLoading: number
    }
  >()

  const ensureBucket = (yardId: string, yardName: string, monthStart: Dayjs) => {
    const monthLabel = monthStart.format('YYYY-MM')
    const key = `${yardId}|${monthLabel}`
    if (!buckets.has(key)) {
      buckets.set(key, {
        yardId,
        yardName,
        monthLabel,
        monthStart,
        demand: 0,
        lateArrival: 0,
        lateLoading: 0,
      })
    }
    return buckets.get(key)!
  }

  for (const d of input.dispatches) {
    if (!d.expectedLoadTime) continue
    // 只在 dispatch.yardIds 中存在的园区落桶（按 yard 维度展开）
    for (const yardId of d.yardIds || []) {
      const yard = input.yards.find((y) => y.id === yardId)
      const yardName = yard?.name || yardId
      const monthStart = dayjs(d.expectedLoadTime.replace(' ', 'T')).startOf('month')
      const b = ensureBucket(yardId, yardName, monthStart)
      b.demand++

      // 未按时到场：主园区 enteredAt - expectedLoadTime > 30min
      const primaryYard = (d.yardTimelines || []).find((y) => y.yardId === d.primaryYardId)
      if (primaryYard?.enteredAt) {
        const diff = Math.round(
          (new Date(primaryYard.enteredAt.replace(' ', 'T')).getTime() -
           new Date(d.expectedLoadTime.replace(' ', 'T')).getTime()) / 60000,
        )
        if (diff > ON_TIME_ARRIVAL_TOLERANCE_MIN) b.lateArrival++
      }

      // 未达成4小时装货：任一 YardTimeline.effectiveLoadMin > 4h
      const a = analysisById.get(d.id)
      if (a) {
        for (const y of a.yards || []) {
          if (y.yardId !== yardId) continue
          if (y.effectiveLoadMin > STANDARD_LOAD_MIN) b.lateLoading++
        }
      }
    }
  }

  // 转 Row 数组 + 计算比率
  const rows: YardMonthlyRow[] = []
  for (const b of buckets.values()) {
    rows.push({
      yardId: b.yardId,
      yardName: b.yardName,
      monthLabel: b.monthLabel,
      monthStart: b.monthStart,
      demand: b.demand,
      lateArrival: b.lateArrival,
      arrivalRate:
        b.demand > 0 ? Math.round(((b.demand - b.lateArrival) / b.demand) * 100) : null,
      lateLoading: b.lateLoading,
      loadingRate:
        b.demand > 0 ? Math.round(((b.demand - b.lateLoading) / b.demand) * 100) : null,
    })
  }

  // 排序：yardName 字典序 → monthLabel 倒序
  rows.sort((a, b) => {
    if (a.yardName !== b.yardName) return a.yardName.localeCompare(b.yardName, 'zh-CN')
    return a.monthLabel < b.monthLabel ? 1 : -1
  })

  return rows
}
