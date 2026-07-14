/**
 * 调度时效分析 Excel 导出工具
 *
 * 设计要点：
 *  1. 单文件 6 Sheet：明细 / 按公司×方向透视 / 按装货园区月度透视 /
 *     按装货园区全期汇总 / 漏斗计数 / 园区对比
 *  2. 仅导出当前筛选结果（由 Page 端先过滤再传入）
 *  3. 文件名固定模板：调度时效分析_YYYYMMDD_HHmm.xlsx
 *  4. 时间戳本地展示为 YYYY-MM-DD HH:mm（不再透出 ISO）
 *  5. 百分比统一为 "xx.x%" 文本格式，避免 Excel 把 50% 解读为 0.5
 *  6. v0.6.0-M2.4 增量：Sheet 5「漏斗计数」+ Sheet 6「园区对比」
 *  7. v0.8.0-M2.7 改造：Sheet 2/3/4 与 UI Tab 完全对齐
 *     - Sheet 2「按公司×方向透视」（吸收原 Sheet 4「按运输方向」+ 原 Sheet 2「按公司」）
 *     - Sheet 3「按装货园区月度透视」（新增）
 *     - Sheet 4「按装货园区全期汇总」（保留原 Sheet 3 旧 GroupRowForExport 格式）
 *     - 删除原 Sheet 4「按运输方向」（Tab 已废弃）
 *
 * Why 不复用 utils/index.ts 的 parseTimestamp：
 *   parseTimestamp 对 "YYYY-MM-DD HH:mm:ss" 会替换为 "YYYY/MM/DDTHH:mm:ss"，
 *   在 Chrome 下返回 NaN。本工具只做展示导出，不参与计算，故无需此函数。
 */

import * as XLSX from 'xlsx'
import type { Dispatch, DispatchEfficiency } from '@/types/dispatch'
import type { Yard } from '@/types/system'
import {
  DIRECTION_DELIVERY_SLA_HOURS,
  ON_TIME_DELIVERY_DEFAULT_HOURS,
} from '@/types/dispatch'
import type { FunnelCounts, YardComparisonRow, YardMonthlyRow, CompanyDirectionRow } from './efficiencyAnalysis'

/** 工具入参（Page 端聚合好直接传） */
export interface ExportParams {
  /** 调车单明细（已按 5 维筛选 + status=completed） */
  analyses: DispatchEfficiency[]
  /** 按公司×运输方向 透视表（v0.8.0-M2.7 新增，Sheet 2 数据源） */
  companyDirectionRows: CompanyDirectionRow[]
  /** 按装货园区×月度 透视表（v0.8.0-M2.7 新增，Sheet 3 数据源） */
  yardMonthlyRows: YardMonthlyRow[]
  /** 按装货园区全期汇总（与「按装货园区」Tab 全期汇总表格一致） */
  groupedByYard: GroupRowForExport[]
  /** dispatch 索引（拿 expectedLoadTime / yardTimelines[0].enteredAt） */
  dispatchLookup: Record<string, Dispatch>
  /** yard 索引（yardId → yardName，用于明细 Sheet 显示装货园区名） */
  yardLookup: Record<string, string>
  /** 5 漏斗计数（v0.6.0-M2.4 新增，Sheet 5 数据源） */
  funnelCounts: FunnelCounts
  /** 园区对比 4 系列（v0.6.0-M2.4 新增，Sheet 6 数据源） */
  yardChartRows: YardComparisonRow[]
}

/** 园区全期汇总（与 Page 端 GroupRankingTable 一致） */
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

/** "x%" 文本，避免 Excel 自动转 0.0x */
function formatPercent(rate: number, denom: number): string {
  if (denom <= 0) return '-'
  return `${rate}%`
}

/** 把分组行拍平成 Row[]（按装货园区全期汇总用） */
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
      方向SLA: `${a.direction ? getSLA(a.direction) : '-'}h`,
      及时到货: a.isOnTimeDelivery === true ? '是' : a.isOnTimeDelivery === false ? '否' : '-',
    }
  })
}

/** Sheet 2：按公司×运输方向 透视表（v0.8.0-M2.7） */
function flattenCompanyDirectionRows(rows: CompanyDirectionRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    物流公司: r.companyName,
    路线: r.direction,
    时效要求: `${r.slaHours}h`,
    应到数量: r.assigned,
    需求到场车辆: r.planned,
    按时到场车辆: r.onTimeArrival,
    及时装货完成车辆: r.onTimeLoading,
    按时到货车辆: r.onTimeDelivery,
  }))
}

/** Sheet 3：按装货园区×月度 透视表（v0.8.0-M2.7） */
function flattenYardMonthlyRows(rows: YardMonthlyRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    园区: r.yardName,
    月份: r.monthLabel,
    调车需求: r.demand,
    未按时到场: r.lateArrival,
    及时到场率: r.arrivalRate === null ? '-' : `${r.arrivalRate}%`,
    未达成4小时装货: r.lateLoading,
    // ❗ FIX(2026-07-14): 加引号
    //   原因: esbuild 严格遵循 ES2015 规范,property key 不能以数字开头
    //   即便后续是中文 ID_Continue(tsc 宽松通过,esbuild 报 Syntax error)
    //   加引号后变成字符串 key,Excel 列名仍是 "4小时装货达成率"
    '4小时装货达成率': r.loadingRate === null ? '-' : `${r.loadingRate}%`,
  }))
}

/** Sheet 4：按装货园区全期汇总（与「按装货园区」Tab 全期汇总 GroupRankingTable 一致） */
function flattenYardGroupRow(rows: GroupRowForExport[]): Record<string, unknown>[] {
  return flattenGroupRow(rows)
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

/** 拿到某方向的 SLA 小时数（未配置走默认 8） */
function getSLA(direction: string): number {
  return DIRECTION_DELIVERY_SLA_HOURS[direction] ?? ON_TIME_DELIVERY_DEFAULT_HOURS
}

/** 主入口：导出当前筛选结果到 6 Sheet xlsx（与 UI Tab 一一对应） */
export function exportDispatchEfficiency(params: ExportParams): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1：调车单明细（与「调车单明细」Tab 一致）
  const detailSheet = XLSX.utils.json_to_sheet(flattenDetailRows(params))
  XLSX.utils.book_append_sheet(wb, detailSheet, '调车单明细')

  // Sheet 2：按公司×方向透视（与「按公司」Tab 一致）
  const companyDirectionSheet = XLSX.utils.json_to_sheet(
    flattenCompanyDirectionRows(params.companyDirectionRows),
  )
  XLSX.utils.book_append_sheet(wb, companyDirectionSheet, '按公司×方向透视')

  // Sheet 3：按装货园区月度透视（与「按装货园区」Tab 上半部分一致）
  const yardMonthlySheet = XLSX.utils.json_to_sheet(
    flattenYardMonthlyRows(params.yardMonthlyRows),
  )
  XLSX.utils.book_append_sheet(wb, yardMonthlySheet, '按装货园区月度透视')

  // Sheet 4：按装货园区全期汇总（与「按装货园区」Tab 下半部分一致）
  const yardSummarySheet = XLSX.utils.json_to_sheet(
    flattenYardGroupRow(params.groupedByYard),
  )
  XLSX.utils.book_append_sheet(wb, yardSummarySheet, '按装货园区全期汇总')

  // Sheet 5：漏斗计数（与页面 KPI 5 漏斗卡一致）
  const funnelSheet = XLSX.utils.json_to_sheet(flattenFunnelCounts(params.funnelCounts))
  XLSX.utils.book_append_sheet(wb, funnelSheet, '漏斗计数')

  // Sheet 6：园区对比（与页面柱状图一致）
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

// re-export for downstream typing（避免下游重新定义）
export { DIRECTION_DELIVERY_SLA_HOURS, ON_TIME_DELIVERY_DEFAULT_HOURS } from '@/types/dispatch'