/**
 * 5 漏斗计数卡行组件（M2.4 v0.6.0）
 *
 * 用途：在调度时效分析页 3 比率卡下方展示「需求到场 → 实际到场 → 已装完 →
 *      已出场 → 已到货」5 个绝对数指标。
 *
 * 设计要点：
 *  1. 5 张卡等宽分屏（Col flex="1 1 0"）
 *  2. 每张卡显示：大数字 + 公式提示 + Tooltip 说明时间字段
 *  3. 配色梯度（紫→蓝→青→绿→橙）匹配漏斗推进
 *  4. 纯展示组件，无数据获取逻辑
 */
import type { ReactNode } from 'react'
import { Card, Col, Row, Statistic, Tooltip } from 'antd'

export type FunnelKey = 'expected' | 'arrived' | 'loaded' | 'exited' | 'delivered'

export interface FunnelCardSpec {
  key: FunnelKey
  /** KPI 标题（中文） */
  title: string
  /** 当前计数（绝对数） */
  value: number
  /** 公式提示（按用户原话"xxx时间在目标时间内车辆总数"） */
  formula: string
  /** Tooltip 说明：判定使用的时间字段 */
  tooltip: string
  /** 前缀图标 */
  icon: ReactNode
  /** 数字色（匹配漏斗梯度） */
  color: string
}

interface Props {
  cards: [FunnelCardSpec, FunnelCardSpec, FunnelCardSpec, FunnelCardSpec, FunnelCardSpec]
}

export function FunnelCountCards({ cards }: Props) {
  return (
    <Row gutter={16} wrap={false}>
      {cards.map((c) => (
        <Col flex="1 1 0" key={c.key} style={{ minWidth: 0 }}>
          <Card size="small" bodyStyle={{ padding: 16 }}>
            <Statistic
              title={c.title}
              value={c.value}
              prefix={c.icon}
              valueStyle={{ color: c.color, fontSize: 28 }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              公式:{c.formula}
            </div>
            <Tooltip title={c.tooltip}>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  cursor: 'help',
                  borderBottom: '1px dashed #d9d9d9',
                  display: 'inline-block',
                  paddingBottom: 1,
                  marginTop: 2,
                }}
              >
                计数方式:任一园区时间戳命中即计 1
              </div>
            </Tooltip>
          </Card>
        </Col>
      ))}
    </Row>
  )
}