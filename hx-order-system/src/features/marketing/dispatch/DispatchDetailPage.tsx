import { Navigate, useParams } from 'react-router-dom'

/**
 * 调车单详情页（已废弃）
 *
 * v0.x 重构：订单 = 调车单 统一为同一概念，详情统一由 `/order/:id` (OrderDetailPage) 渲染。
 * 此处保留壳仅为兼容老路由 `/marketing/dispatch/:id`，跳转重定向到 `/order/:id`。
 *
 * 业务术语仍叫"调车单"，UI 标题统一为"订单详情"。
 */
export function DispatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/orders/${id}`} replace />
}