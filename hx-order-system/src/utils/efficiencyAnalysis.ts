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

import type { Dispatch, YardTimeline, DispatchEfficiency, YardEfficiency } from '@/types/dispatch'
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