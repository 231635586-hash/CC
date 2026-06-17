// 编制管理常量

// 颜色状态阈值
export const STAFFING_THRESHOLDS = {
  NORMAL: 0.2,    // 充足：剩余 > 20%
  WARNING: 0,      // 紧张：0 < 剩余 ≤ 20%
  DANGER: -1,     // 满编：剩余 ≤ 0
} as const;

// API 延迟（ms）
export const API_DELAY = 300;

// 年份选择范围
export const YEAR_RANGE = 11;

// 批量编辑模式最大修改数
export const BATCH_EDIT_MAX_CELLS = 1000;

// 状态文本
export const STATUS_TEXT = {
  normal: '充足',
  warning: '紧张',
  danger: '满编',
  empty: '无数据',
} as const;

// 状态颜色
export const STATUS_COLORS = {
  normal: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-orange-50 text-orange-700 border-orange-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  empty: 'bg-gray-50 border-dashed border-gray-300 text-gray-400',
} as const;