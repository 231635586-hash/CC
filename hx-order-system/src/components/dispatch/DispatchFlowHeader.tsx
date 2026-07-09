/**
 * 调车单流程栏（订单状态进度条 + 推进部门 + 角色化操作区）
 *
 * 用于在所有"调车单详情页"顶部统一展示：
 *  - 4 步流程进度（待受理 → 调度中 → 履约中 → 已完成）
 *  - 当前子状态（按 DispatchStatus 着色）
 *  - 当前推进部门
 *  - 角色化操作按钮（由调用方传入 renderActions 渲染）
 *
 * 涉及页面：
 *  - OrderDetailPage          (/orders/:id)
 *  - DispatchDetailPage       (/marketing/dispatch/:id)
 *  - WarehouseDispatchDetailPage (/warehouse/dispatch/:id)
 *
 * 设计原则：
 *  - 不耦合业务逻辑（操作按钮由调用方传入）
 *  - 不耦合具体角色（角色差异由 renderActions 表达）
 *  - cancelled / draft 状态不显示 Steps，进度条替换为静态 Tag
 */
import { Card, Row, Col, Steps, Space, Tag } from 'antd'
import type { ReactNode } from 'react'
import { StatusTag } from '@/components'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import type { Dispatch } from '@/types/dispatch'
import {
  ORDER_BOARD_COLUMNS,
  ORDER_STATUS_OPTIONS,
} from '@/types/order'
import {
  deriveOrderStatus,
  orderSubStatusLabel,
} from '@/utils/orderStatus'

/** DispatchStatus 字典（用于 StatusTag 注入） */
const DISPATCH_STATUS_MAP = Object.fromEntries(
  DISPATCH_STATUS_OPTIONS.map((o) => [o.value, { label: o.label, color: o.color }]),
) as Record<Dispatch['status'], { label: string; color: string }>

interface Props {
  dispatch: Dispatch
  /** 角色化操作按钮渲染器（按 dispatch.status 切换） */
  renderActions?: () => ReactNode
  /** 顶部右侧额外内容（如返回按钮之外的信息提示） */
  headerExtra?: ReactNode
}

/**
 * 调车单详情页顶部流程栏
 *
 * @example
 *   <DispatchFlowHeader
 *     dispatch={record}
 *     renderActions={() => <Button>派车</Button>}
 *   />
 */
export function DispatchFlowHeader({ dispatch, renderActions, headerExtra }: Props) {
  const orderStatus = deriveOrderStatus(dispatch)
  const orderOpt = ORDER_STATUS_OPTIONS.find((o) => o.value === orderStatus)
  const boardIndex = ORDER_BOARD_COLUMNS.indexOf(orderStatus)
  const isTerminal = orderStatus === 'cancelled' || orderStatus === 'draft'

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row align="middle" gutter={16}>
        <Col flex="auto">
          {isTerminal ? (
            // 终态：不显示 Steps，显示订单主状态 + 当前子状态
            <Space>
              <span>订单主状态：</span>
              <Tag color={orderOpt?.color}>
                {orderOpt?.emoji} {orderOpt?.label}
              </Tag>
              <span style={{ color: '#999' }}>当前子状态</span>
              <StatusTag value={dispatch.status} map={DISPATCH_STATUS_MAP} />
            </Space>
          ) : (
            // 进行中：显示 4 步流程
            <Steps
              size="small"
              current={boardIndex}
              items={ORDER_BOARD_COLUMNS.map((c) => {
                const o = ORDER_STATUS_OPTIONS.find((x) => x.value === c)!
                return {
                  title: o.label,
                  description:
                    c === orderStatus ? orderSubStatusLabel(dispatch) : o.dept,
                }
              })}
            />
          )}
        </Col>
        <Col>
          <Space direction="vertical" align="end" size={4}>
            <span style={{ fontSize: 12, color: '#999' }}>
              推进部门：{orderOpt?.dept}
            </span>
            {renderActions?.()}
            {headerExtra}
          </Space>
        </Col>
      </Row>
    </Card>
  )
}