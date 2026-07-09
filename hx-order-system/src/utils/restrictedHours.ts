/**
 * 厂区禁行时段配置（M2 调度时效分析）
 *
 * 默认禁行时段（M2 mock 阶段硬编码，后续可改为 Yard.restrictedHours 配置）：
 *   - 00:00 - 01:00
 *   - 06:00 - 08:00
 *   - 11:30 - 13:30
 *   - 17:30 - 20:00
 *
 * 装车耗时计算时需扣除这些时段的总时长（规则 2）。
 */

export interface RestrictedTimeRange {
  start: string // 'HH:mm'
  end: string // 'HH:mm'
}

export const RESTRICTED_HOURS: RestrictedTimeRange[] = [
  { start: '00:00', end: '01:00' },
  { start: '06:00', end: '08:00' },
  { start: '11:30', end: '13:30' },
  { start: '17:30', end: '20:00' },
]

/** 解析 'YYYY-MM-DD HH:mm:ss' → 当天的 Date 对象 */
function parseLocalDate(s: string): Date {
  return new Date(s.replace(/-/g, '/').replace(' ', 'T'))
}

/** 给定日期 + 'HH:mm'，返回当天的 Date 对象 */
function dateWithTime(baseDate: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * 计算两个时间戳之间落入禁行时段的总分钟数
 *
 * 算法：对每天单独计算 [start, end] 与每个禁行时段的交集
 *   - 简化处理：假设 start 和 end 在同一天（跨天场景 M3 处理）
 *   - 交集最小单位 = 分钟
 */
export function calcRestrictedMinutes(start: string, end: string): number {
  if (!start || !end) return 0
  const startDate = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  if (endDate <= startDate) return 0

  let totalMin = 0
  // 按天遍历（从 start 那天到 end 那天，含头含尾）
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= endDate) {
    for (const range of RESTRICTED_HOURS) {
      const rStart = dateWithTime(cursor, range.start)
      const rEnd = dateWithTime(cursor, range.end)
      // 交集：[max(start, rStart), min(end, rEnd)]
      const overlapStart = new Date(Math.max(startDate.getTime(), rStart.getTime()))
      const overlapEnd = new Date(Math.min(endDate.getTime(), rEnd.getTime()))
      if (overlapEnd > overlapStart) {
        totalMin += Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000)
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return totalMin
}

/** 标准用时（分钟）：M2 mock 默认 4 小时 */
export const STANDARD_LOAD_MIN = 4 * 60