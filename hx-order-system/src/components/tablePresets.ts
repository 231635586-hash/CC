/**
 * 表格预设常量
 * 统一所有 ListPage 的 scroll.x 和"操作"列宽度，
 * 避免各页面数字分散、未来加按钮时宽度难预估。
 */

/** antd Table scroll.x 预设 */
export const SCROLL_PRESETS = {
  /** 表格列少，3-4 列时使用 */
  narrow: 1200,
  /** 常规宽度（5-7 列） */
  medium: 1500,
  /** 列较多（8-10 列） */
  wide: 1800,
  /** 极宽（10+ 列） */
  full: 2000,
} as const

/** 操作列默认宽度（含 2-3 个按钮；按钮溢出时按需 +20） */
export const ACTION_COL_WIDTH = 220
