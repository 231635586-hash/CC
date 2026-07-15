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

/**
 * 解析多种格式时间戳字符串为 Date 对象
 * 兼容：
 *   - ISO 8601:  2026-06-26T06:43:07.250Z / 2026-06-26T14:42:25
 *   - 本地格式:  2026-06-26 14:42:25
 *   - Date 对象直接返回
 */
export function parseTimestamp(input: string | Date): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (!input || typeof input !== 'string') return null
  // ISO 8601 格式（含 T 或 Z）—— 标准 Date 解析
  if (input.includes('T') || input.endsWith('Z')) {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // 本地格式 YYYY-MM-DD HH:mm:ss → 浏览器兼容的 YYYY/MM/DD HH:mm:ss
  const normalized = input.replace(/-/g, '/').replace(' ', 'T')
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 格式化日期时间为「YYYY-MM-DD HH:mm:ss」字符串
 *
 * 自动识别 ISO 8601 与本地格式输入，统一转换为本地时间显示。
 * 用于展示端兜底（如 markYardEntered 之前误写 ISO 格式的脏数据）。
 */
export function formatDateTime(input: string | Date | undefined | null): string {
  if (!input) return '-'
  const d = parseTimestamp(input)
  if (!d) {
    // 兜底：无法解析时原样输出字符串
    return typeof input === 'string' ? input : '-'
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 获取当前时间，格式化为「YYYY-MM-DD HH:mm:ss」字符串
 * 替代各处重复的 `new Date().toISOString()`（后者输出 ISO 8601 与本地时间显示不一致）
 */
export function nowIsoString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 把本地/ISO 时间戳字符串转为毫秒数（NaN-safe）
 *
 * 用途：替换散落 6 处的 `new Date(x.replace(' ', 'T')).getTime()`(Safari 兼容 hack)
 * 实现：复用 parseTimestamp,支持 ISO 8601 + 本地格式 + Date 对象输入
 * 失败返回 NaN(由调用方自行 .isNaN 判断)
 */
export function localDateMs(input: string | Date | undefined | null): number {
  if (!input) return NaN
  const d = parseTimestamp(input)
  return d ? d.getTime() : NaN
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
