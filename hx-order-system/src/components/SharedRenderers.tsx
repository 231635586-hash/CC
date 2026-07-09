/**
 * 共享渲染工具
 * 集中放置"按 id 查名字"、"yardIds 拼接"等跨模块重复的渲染逻辑，
 * 避免每个表格 render 函数各写一份。
 */
import type { Yard } from '@/types'

/**
 * 把 yardIds 渲染为「秦壁 / 甘亭」格式，优先入场园区加【】标记。
 *
 * @param yardIds 园区 id 列表
 * @param primaryYardId 优先入场园区 id（来自 yardIds 中的某一项）
 * @param yards 园区字典（用于查 name）
 * @returns 渲染字符串；yardIds 为空时返回 '-'
 *
 * @example
 *   renderYardNames(['y1', 'y2'], 'y1', yards) // "【秦壁】 / 甘亭"
 */
export function renderYardNames(
  yardIds: string[] | undefined,
  primaryYardId: string | undefined,
  yards: Yard[],
): string {
  if (!yardIds || yardIds.length === 0) return '-'
  return yardIds
    .map((id) => {
      const hit = yards.find((y) => y.id === id)
      const name = hit?.name || id
      return id === primaryYardId ? `【${name}】` : name
    })
    .join(' / ')
}
