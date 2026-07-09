/**
 * 调车单多园区时间线派生工具（M2）
 *
 * 所有 enterYardAt / leaveYardAt / 总排队时长等字段都从 yardTimelines 推导，
 * 保证单一数据源；老字段保留以做向后兼容展示。
 */
import type { Dispatch } from '@/types/dispatch'

/** 最终入场时间 = 第一个已入场的园区时间 */
export function getEnterYardAt(d: Dispatch): string | undefined {
  return d.yardTimelines?.find((y) => y.enteredAt)?.enteredAt
}

/** 最终离场时间 = 最后一个已离场的园区时间 */
export function getLeaveYardAt(d: Dispatch): string | undefined {
  if (!d.yardTimelines?.length) return undefined
  return [...d.yardTimelines].reverse().find((y) => y.leftAt)?.leftAt
}

/** 总排队时长（毫秒）= 各园区 (enteredAt - queuedAt) 累加 */
export function getTotalQueueMs(d: Dispatch): number {
  if (!d.yardTimelines?.length) return 0
  return d.yardTimelines.reduce((sum, y) => {
    if (y.queuedAt && y.enteredAt) {
      return sum + (new Date(y.enteredAt).getTime() - new Date(y.queuedAt).getTime())
    }
    return sum
  }, 0)
}

/** 当前进行中的园区索引（用于多园区循环；返回 -1 表示全部离场） */
export function getActiveYardIndex(d: Dispatch): number {
  if (!d.yardTimelines?.length) return -1
  return d.yardTimelines.findIndex((y) => !y.leftAt)
}

/** 第一个未离场园区的索引（同 getActiveYardIndex，命名更清晰） */
export function getNextYardIndex(d: Dispatch): number {
  return getActiveYardIndex(d)
}

/** 格式化时长（毫秒 → "1h 23m" / "23m 45s"） */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '-'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}