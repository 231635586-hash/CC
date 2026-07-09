/**
 * Mock 用户兜底常量
 *
 * 集中定义"库存/客户历史数据迁移时统一回填"的默认操作人，
 * 避免在多个 store / mock 文件里硬编码字符串。
 *
 * 真实环境中，这些 id/name 来自 useAuthStore.currentUser，
 * 只有 currentUser 为 null 时才降级使用这里的常量。
 */
import type { Operator } from '@/hooks/useOperator'

/** 库存默认业务员：mock-user-002「李营销」 */
export const FALLBACK_SALES_USER: Operator = {
  id: 'mock-user-002',
  name: '李营销',
}

/** 客户默认添加人：mock-user-005「李欣」 */
export const FALLBACK_CREATOR_USER: Operator = {
  id: 'mock-user-005',
  name: '李欣',
}
