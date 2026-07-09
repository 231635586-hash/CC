/**
 * 操作人（添加人/业务员）共用 hook
 * 统一 Inventory（业务员）、Customer（添加人）、Dispatch（创建人）等场景下的
 * "新增自动取 currentUser，编辑保留原录入人" 三级降级逻辑。
 */
import { useAuthStore } from '@/stores/auth'

export interface Operator {
  id: string
  name: string
}

/** 当前登录用户；未登录时降级为「未知用户」 */
export function useCurrentOperator(): Operator {
  const u = useAuthStore((s) => s.currentUser)
  return {
    id: u?.id || 'unknown',
    name: u?.realName || '未知用户',
  }
}

/**
 * 解析操作人：编辑已有记录保留原值，新建时取当前用户
 *
 * @param original 已存在的"添加人 id/name"（来自 editing 记录）
 * @param formValue 表单中的"添加人 id/name"（hidden 字段提交）
 * @param current 当前登录用户（fallback）
 */
export function resolveOperator(
  original: { id?: string; name?: string } | undefined | null,
  formValue: { id?: string; name?: string } | undefined,
  current: Operator,
): { id: string; name: string } {
  return {
    id: original?.id || formValue?.id || current.id,
    name: original?.name || formValue?.name || current.name,
  }
}
