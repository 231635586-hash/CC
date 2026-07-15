/**
 * 园区时效对比柱状图（M2.4 v0.6.0 · 优化版 v3）
 *
 * v3 改造（用户反馈）：
 *  - 1 yard 1 chart：每个园区独立 Card + 4 根柱
 *  - 多园区横向并排（Row + Col flex="1 1 0"）
 *  - X 轴 4 指标（需求到场/按时到场/及时装货完成/按时到货）
 *  - 柱顶 label: 数量 + (占比%)
 *  - 占比分母按各 metric 语义:
 *      需求到场 = 100%
 *      按时到场 / 及时装货 / 按时到货 = 该值 / expected
 *  - 配色沿用: 秦壁蓝 / 甘亭紫
 *  - Sheet 6 表格保持原状(园区 × 4 指标矩阵)用于下钻
 */
import { useMemo } from 'react'
import { Card, Col, Empty, Row, Spin } from 'antd'
import * as echarts from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TitleComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import ReactECharts from 'echarts-for-react'
import type { YardComparisonRow } from '@/utils/efficiencyAnalysis'

// 注册所需模块（仅一次）
echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

interface Props {
  rows: YardComparisonRow[]
  /** 单个 chart 高度（默认 320） */
  height?: number
  /** loading 透传（暂未使用，预留） */
  loading?: boolean
}

/** X 轴 4 指标（顺序与漏斗推进一致） */
const METRICS = [
  { key: 'expected', label: '需求到场' },
  { key: 'onTimeArrival', label: '按时到场' },
  { key: 'onTimeLoading', label: '及时装货完成' },
  { key: 'onTimeDelivery', label: '按时到货' },
] as const

/** 园区配色（mock-yard-001 秦壁=蓝, mock-yard-002 甘亭=紫） */
const YARD_COLORS: Record<string, string> = {
  'mock-yard-001': '#1677ff', // 秦壁 - AntD primary 蓝
  'mock-yard-002': '#722ed1', // 甘亭 - 紫
}
const FALLBACK_COLOR = '#13c2c2' // 其他园区兜底

type EChartsOption = echarts.ComposeOption<
  | BarSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

/**
 * 计算单根柱顶 label（数量 + 占比%）
 *  - expected (需求到场) 永远是 100%，只显示数量
 *  - 其他 metric = count / 该 yard 的 expected
 */
function formatBarLabel(metricKey: string, count: number, expected: number): string {
  if (count <= 0) return ''
  if (metricKey === 'expected') return `${count}`
  if (expected <= 0) return `${count}`
  const pct = Math.round((count / expected) * 100)
  return `${count}\n(${pct}%)`
}

/** 单个园区的图表 option 构造 */
function buildYardOption(row: YardComparisonRow): EChartsOption {
  const color = YARD_COLORS[row.yardId] ?? FALLBACK_COLOR
  const metricLabels = METRICS.map((m) => m.label)
  const counts = METRICS.map((m) => row[m.key])

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const arr = params as Array<{
          name: string
          value: number
          marker: string
          dataIndex: number
        }>
        if (!arr?.length) return ''
        const metric = arr[0].name
        const lines = arr
          .map((p) => {
            const metricKey = METRICS[p.dataIndex]?.key ?? ''
            const expected = row.expected
            return `${p.marker} 数量: <b>${formatBarLabel(metricKey, p.value, expected).replace('\n', ' ')}</b>`
          })
          .join('<br/>')
        return `<div style="font-weight:600;margin-bottom:4px">${metric}</div>${lines}`
      },
    },
    grid: { left: 56, right: 16, top: 32, bottom: 64, containLabel: true },
    xAxis: {
      type: 'category',
      name: '业务指标',
      nameLocation: 'end',
      nameGap: 18,
      nameTextStyle: { fontSize: 12, color: '#666', fontWeight: 500 },
      data: metricLabels,
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 11, fontWeight: 500, interval: 0 },
    },
    yAxis: {
      type: 'value',
      name: '车辆数(辆)',
      nameLocation: 'end',
      nameGap: 12,
      nameTextStyle: { fontSize: 12, color: '#666', fontWeight: 500 },
      minInterval: 1,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barWidth: '40%',
        itemStyle: { color },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          color: '#333',
          lineHeight: 14,
          formatter: (params) => {
            const dataIndex = (params as { dataIndex: number }).dataIndex
            const metricKey = METRICS[dataIndex]?.key ?? ''
            return formatBarLabel(metricKey, counts[dataIndex], row.expected)
          },
        },
        data: counts,
      },
    ],
  }
}

export function YardComparisonChart({ rows, height = 320, loading: _loading }: Props) {
  const hasData = rows.length > 0

  // 缓存每个 row 的 option（避免每次渲染重新构造）
  const options = useMemo<EChartsOption[]>(
    () => rows.map((row) => buildYardOption(row)),
    [rows],
  )

  return (
    <Card
      title="园区时效对比（按园区分图）"
      extra={_loading ? <Spin size="small" /> : null}
      bodyStyle={{ padding: 16 }}
    >
      {hasData ? (
        <Row gutter={[16, 16]}>
          {rows.map((row, i) => (
            <Col
              key={row.yardId}
              // 1 个园区: 满宽;2+ 个: 等宽分摊
              flex={rows.length === 1 ? '1 1 100%' : '1 1 0%'}
              style={{ minWidth: 0 }}
            >
              <Card
                size="small"
                title={
                  <span style={{ fontSize: 13 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: YARD_COLORS[row.yardId] ?? FALLBACK_COLOR,
                        marginRight: 8,
                        verticalAlign: 'middle',
                      }}
                    />
                    {row.yardName}园区
                  </span>
                }
                bodyStyle={{ padding: 8 }}
              >
                <ReactECharts
                  option={options[i]}
                  style={{ height, width: '100%' }}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'canvas' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div
          style={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description="暂无园区对比数据" />
        </div>
      )}
    </Card>
  )
}