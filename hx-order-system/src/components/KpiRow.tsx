/**
 * KPI 统计行（4 列等宽 + Card + Statistic）
 *
 * 用途：替代多处 `<Row gutter={16}><Col span={6}><Card><Statistic .../></Card></Col></Row>` 重复模板
 * 设计：
 *  - items 由调用方传入（每个 KPI 一个对象）
 *  - 默认 4 列等宽（span=6），调用方可传 colSpan 自定义
 *  - color / prefix / suffix / tooltip 全部 optional
 *
 * 涉及的页面（已迁移 / 待迁移）：
 *  - WarehouseQueuePage            ◯ TODO
 *  - InventoryListPage             ◯ TODO
 *  - LocationListPage              ◯ TODO
 *  - DispatchSchedulePage          ◯ TODO
 *  - EfficiencyAnalysisPage        ◯ TODO（3 KPI 比率卡 + 5 漏斗卡可分两次替换）
 */
import { Card, Col, Row, Statistic, Tooltip } from 'antd'
import type { ReactNode } from 'react'

export interface KpiItem {
  /** 标题 */
  title: string
  /** 数值 */
  value: number | string
  /** 前缀图标(可选) */
  prefix?: ReactNode
  /** 后缀(可选,如"单" / "%") */
  suffix?: ReactNode
  /** 数值颜色(可选,默认不设色) */
  color?: string
  /** 鼠标 hover 提示(可选) */
  tooltip?: string
  /** 是否使用 precision 显示小数(可选) */
  precision?: number
}

export interface KpiRowProps {
  items: KpiItem[]
  /** 每列 span,默认 6(24-grid 中的 6/24 = 4 列等宽) */
  colSpan?: number
  /** 行底部 margin,默认 16 */
  style?: React.CSSProperties
}

/**
 * 等宽 KPI 行
 *
 * @example
 *   <KpiRow items={[
 *     { title: '排队中', value: 5, prefix: <ClockIcon />, color: '#fa8c16' },
 *     { title: '已完成', value: 12, color: '#52c41a' },
 *   ]} />
 */
export function KpiRow({ items, colSpan = 6, style }: KpiRowProps) {
  return (
    <Row gutter={16} style={style}>
      {items.map((it, i) => {
        const stat = (
          <Statistic
            title={it.title}
            value={it.value}
            prefix={it.prefix}
            suffix={it.suffix}
            precision={it.precision}
            valueStyle={it.color ? { color: it.color } : undefined}
          />
        )
        return (
          <Col key={i} span={colSpan}>
            <Card>{it.tooltip ? <Tooltip title={it.tooltip}>{stat}</Tooltip> : stat}</Card>
          </Col>
        )
      })}
    </Row>
  )
}
