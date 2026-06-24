/**
 * 工具函数
 */

/** 生成 mock ID */
export function genId(prefix = 'mock'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 生成调车单编号（预生成） */
export function genDispatchNo(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `DC${ymd}${seq}`
}

/** 格式化日期 */
export function formatDate(d: string | Date | undefined, fmt = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!d) return '-'
  // 简单格式化：直接显示
  if (typeof d === 'string') return d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 解析城市字符串为去重数组 */
export function parseCities(s: string | undefined | null): string[] {
  if (!s) return []
  return Array.from(
    new Set(
      s
        .split(/[/,，、\s]+/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  )
}

/** 数组转回展示字符串（统一用「 / 」分隔） */
export function formatCities(arr: string[] | undefined | null): string {
  return (arr || []).filter(Boolean).join(' / ')
}

/** 启用状态 */
export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  enabled: { label: '启用', color: 'green' },
  disabled: { label: '停用', color: 'default' },
}
