/**
 * 调度时效分析 Excel 导出工具
 *
 * 设计要点：
 *  1. 单文件 6 Sheet：明细 / 按公司 / 按装货园区 / 按运输方向 / 漏斗计数 / 园区对比
 *  2. 仅导出当前筛选结果（由 Page 端先过滤再传入）
 *  3. 文件名固定模板：调度时效分析_YYYYMMDD_HHmm.xlsx
 *  4. 时间戳本地展示为 YYYY-MM-DD HH:mm（不再透出 ISO）
 *  5. 百分比统一为 "xx.x%" 文本格式，避免 Excel 把 50% 解读为 0.5
 *  6. v0.6.0-M2.4 增量：Sheet 5「漏斗计数」+ Sheet 6「园区对比」
 *
 * Why 不复用 utils/index.ts 的 parseTimestamp：
 *   parseTimestamp 对 "YYYY-MM-DD HH:mm:ss" 会替换为 "YYYY/MM/DDTHH:mm:ss"，
 *   在 Chrome 下返回 NaN。本工具只做展示导出，不参与计算，故无需此函数。
 */

import * as XLSX from 'xlsx'
import type { Dispatch, DispatchEfficiency, Yard } from '@/types/dispatch'
import { DIRECTION_DELIVERY_SLA_HOURS, ON_TIME_DELIVERY_DEFAULT_HOURS } from '@/types/dispatch'
import type { FunnelCounts, YardComparisonRow } from './efficiencyAnalysis'

/** 工具入参（Page 端聚合好直接传） */
export interface ExportParams {
  /** 调车单明细（已按 5 维筛选 + status=completed） */
  analyses: DispatchEfficiency[]
  /** 按公司分组聚合（已在 Page 算好） */
  groupedByCompany: GroupRowForExport[]
  /** 按装货园区分组聚合 */
  groupedByYard: GroupRowForExport[]
  /** 按运输方向分组聚合 */
  groupedByDirection: GroupRowForExport[]
  /** dispatch 索引（拿 expectedLoadTime / yardTimelines[0].enteredAt） */
  dispatchLookup: Record<string, Dispatch>
  /** yard 索引（yardId → yardName，用于明细 Sheet 显示装货园区名） */
  yardLookup: Record<string, string>
  /** 5 漏斗计数（v0.6.0-M2.4 新增，Sheet 5 数据源） */
  funnelCounts: FunnelCounts
  /** 园区对比 4 系列（v0.6.0-M2.4 新增，Sheet 6 数据源） */
  yardChartRows: YardComparisonRow[]
}

export interface GroupRowForExport {
  key: string
  name: string
  total: number
  onTimeArrivalRate: number
  onTimeArrivalDenom: number
  onTimeDeliveryRate: number
  onTimeDeliveryDenom: number
}

/** "2026-07-22 18:30:00" → "2026-07-22 18:30"（展示用，不做时间计算） */
function formatTime(ts: string | undefined): string {
  if (!ts) return ''
  // 输入形如 "YYYY-MM-DD HH:mm:ss" 或 ISO
  const m = ts.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : ts
}

/** 分钟 → "Xh Ym" / "Ym"（与 Page 端 formatMinutesAsHour 保持一致） */
function formatMinutes(min: number): string {
  if (!min || min <= 0) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** "x%" 文本，避免 Excel 自动转 0.0x */
function formatPercent(rate: number, denom: number): string {
  if (denom <= 0) return '-'
  return `${rate}%`
}

/** 拿到某方向的 SLA 小时数（未配置走默认 8） */
function getSLA(direction: string): number {
  return DIRECTION_DELIVERY_SLA_HOURS[direction] ?? ON_TIME_DELIVERY_DEFAULT_HOURS
}

/** 把分组行拍平成 Row[] */
function flattenGroupRow(rows: GroupRowForExport[]): Record<string, unknown>[] {
  return rows.map((r, i) => ({
    排名: i + 1,
    分组: r.name,
    总单数: r.total,
    及时到场率: formatPercent(r.onTimeArrivalRate, r.onTimeArrivalDenom),
    及时到货率: formatPercent(r.onTimeDeliveryRate, r.onTimeDeliveryDenom),
  }))
}

/** 把 analyses 拍平成明细 Row[] */
function flattenDetailRows(params: ExportParams): Record<string, unknown>[] {
  const { analyses, dispatchLookup, yardLookup } = params
  return analyses.map((a) => {
    const d = dispatchLookup[a.dispatchId]
    const expectedLoadTime = d?.expectedLoadTime
    const primaryEnteredAt = d?.yardTimelines?.[0]?.enteredAt
    const yardNames = (a.yardIds || [])
      .map((id) => yardLookup[id] || id)
      .join('、')

    return {
      调车编号: a.dispatchNo,
      运输方向: a.direction || '-',
      发运方式: a.shippingMethod || '-',
      物流公司: a.companyName || '-',
      装货园区: yardNames || '-',
      计划装货时间: formatTime(expectedLoadTime),
      主园区入场时间: formatTime(primaryEnteredAt),
      到场差异: a.arrivalDiffMin !== undefined ? a.arrivalDiffMin : '-',
      及时到场: a.isOnTimeArrival === true ? '是' : a.isOnTimeArrival === false ? '否' : '-',
      方向SLA: `${getSLA(a.direction)}h`,
      及时到货: a.isOnTimeDelivery === true ? '是' : a.isOnTimeDelivery === false ? '否' : '-',
    }
  })
}

/** Sheet 5：5 漏斗计数（v0.6.0-M2.4） */
function flattenFunnelCounts(fc: FunnelCounts): Record<string, unknown>[] {
  return [
    { 排名: 1, 指标: '需求到场', 当前计数: fc.expected, 公式: '需求时间(expectedLoadTime)在筛选范围内车辆总数' },
    { 排名: 2, 指标: '实际到场', 当前计数: fc.arrived, 公式: '排队时间(queuedAt)在筛选范围内车辆总数' },
    { 排名: 3, 指标: '已装完', 当前计数: fc.loaded, 公式: '装货完成时间(loadingCompletedAt)在筛选范围内车辆总数' },
    { 排名: 4, 指标: '已出场', 当前计数: fc.exited, 公式: '出场时间(leftAt)在筛选范围内车辆总数' },
    { 排名: 5, 指标: '已到货', 当前计数: fc.delivered, 公式: '到货时间(driverConfirmedAt)在筛选范围内车辆总数' },
  ]
}

/** Sheet 6：园区对比 4 系列（v0.6.0-M2.4） */
function flattenYardChartRows(rows: YardComparisonRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    园区: r.yardName,
    需求到场数: r.expected,
    按时到场数: r.onTimeArrival,
    及时装货完成数: r.onTimeLoading,
    按时到货数: r.onTimeDelivery,
  }))
}

/** 主入口：导出当前筛选结果到 6 Sheet xlsx */
export function exportDispatchEfficiency(params: ExportParams): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1：调车单明细
  const detailSheet = XLSX.utils.json_to_sheet(flattenDetailRows(params))
  XLSX.utils.book_append_sheet(wb, detailSheet, '调车单明细')

  // Sheet 2：按公司
  const companySheet = XLSX.utils.json_to_sheet(flattenGroupRow(params.groupedByCompany))
  XLSX.utils.book_append_sheet(wb, companySheet, '按公司')

  // Sheet 3：按装货园区
  const yardSheet = XLSX.utils.json_to_sheet(flattenGroupRow(params.groupedByYard))
  XLSX.utils.book_append_sheet(wb, yardSheet, '按装货园区')

  // Sheet 4：按运输方向（额外带 SLA 列）
  const directionRows = params.groupedByDirection.map((r, i) => ({
    排名: i + 1,
    运输方向: r.name,
    方向SLA: `${getSLA(r.name)}h`,
    总单数: r.total,
    及时到货率: formatPercent(r.onTimeDeliveryRate, r.onTimeDeliveryDenom),
    及时到场率: formatPercent(r.onTimeArrivalRate, r.onTimeArrivalDenom),
  }))
  const directionSheet = XLSX.utils.json_to_sheet(directionRows)
  XLSX.utils.book_append_sheet(wb, directionSheet, '按运输方向')

  // Sheet 5：漏斗计数（v0.6.0-M2.4）
  const funnelSheet = XLSX.utils.json_to_sheet(flattenFunnelCounts(params.funnelCounts))
  XLSX.utils.book_append_sheet(wb, funnelSheet, '漏斗计数')

  // Sheet 6：园区对比（v0.6.0-M2.4）
  const yardChartSheet = XLSX.utils.json_to_sheet(flattenYardChartRows(params.yardChartRows))
  XLSX.utils.book_append_sheet(wb, yardChartSheet, '园区对比')

  // 文件名：调度时效分析_YYYYMMDD_HHmm.xlsx
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}`
  const filename = `调度时效分析_${stamp}.xlsx`

  XLSX.writeFile(wb, filename)
}

/** Yard[] → Record<yardId, yardName> */
export function buildYardLookup(yards: Yard[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const y of yards) out[y.id] = y.name
  return out
}

/** Dispatch[] → Record<dispatchId, Dispatch> */
export function buildDispatchLookup(dispatches: Dispatch[]): Record<string, Dispatch> {
  const out: Record<string, Dispatch> = {}
  for (const d of dispatches) out[d.id] = d
  return out
}