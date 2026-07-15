/**
 * 调车单布尔字段标签（紧急 / 拼车）
 *
 * 用途：替代 4 处重复的 `{record.isUrgent && <Tag color="red">紧急</Tag>}` + `{record.isCarpool && <Tag color="purple">拼车</Tag>}` 内联块
 * 设计：
 *  - 接收 isUrgent / isCarpool 两个布尔值
 *  - 都为 false 时显示 placeholder（默认 '-'）
 *  - 颜色与文案集中在一处（改色只改 BOOL_TAG_RECORD）
 *
 * 涉及的页面（已迁移 / 待迁移）：
 *  - OrderDetailPage            ◯ TODO
 *  - OrderBoardPage             ◯ TODO
 *  - DispatchDetailPage         ◯ TODO
 *  - DispatchListPage           ◯ TODO
 */
import { Tag, Space } from 'antd'

/** 布尔标签字典（颜色 + 文案集中维护） */
export const BOOL_TAG_RECORD = {
  isUrgent: { color: 'red', label: '紧急' },
  isCarpool: { color: 'purple', label: '拼车' },
} as const

export type BoolTagKey = keyof typeof BOOL_TAG_RECORD

export interface BoolTagsProps {
  isUrgent?: boolean
  isCarpool?: boolean
  /** 都为 false 时显示,默认 '-' */
  placeholder?: string
}

export function BoolTags({ isUrgent, isCarpool, placeholder = '-' }: BoolTagsProps) {
  if (!isUrgent && !isCarpool) return <>{placeholder}</>
  return (
    <Space size={4}>
      {isUrgent && <Tag color={BOOL_TAG_RECORD.isUrgent.color}>{BOOL_TAG_RECORD.isUrgent.label}</Tag>}
      {isCarpool && <Tag color={BOOL_TAG_RECORD.isCarpool.color}>{BOOL_TAG_RECORD.isCarpool.label}</Tag>}
    </Space>
  )
}
