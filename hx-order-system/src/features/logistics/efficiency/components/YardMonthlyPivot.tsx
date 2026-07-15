/**
 * 园区 × 月度 透视表组件（M2.5 v0.7.0）
 *
 * 用途：在「按园区」Tab 默认位展示按园区分组的月度统计透视表。
 *
 * 设计要点：
 *  1. 7 列：园区(合并单元格) / 月份 / 调车需求(辆) / 未按时到场(辆) /
 *     及时到场率 / 未达成4小时装货(辆) / 4小时装货达成率
 *  2. 数据源：buildYardMonthlyRows（utils 层）
 *  3. 排序：yardName 字典序 → monthLabel 倒序（最新月在上）
 *  4. 比率列：demand=0 时显示 "-" 而非 #DIV/0!；用 Tag 着色（>=80 green, <80 red）
 *  5. 园区合并：通过 rowSpan 实现；monthStart 用于 Tooltip 展示完整日期
 */
import { useMemo } from 'react'
import { Empty, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { YardMonthlyRow } from '@/utils/efficiencyAnalysis'

interface Props {
  rows: YardMonthlyRow[]
  loading?: boolean
}

export function YardMonthlyPivot({ rows, loading }: Props) {
  // 给每个 row 加上连续的 rowSpan 计算（基于 yardName 分组）
  const displayRows = useMemo(() => {
    // 先按 yardName group，再 group 内按 monthLabel 倒序（utils 已排好）
    const groupSizes = new Map<string, number>()
    for (const r of rows) {
      groupSizes.set(r.yardName, (groupSizes.get(r.yardName) ?? 0) + 1)
    }

    // 计算每个 row 的 yardName rowSpan（仅第一条占 rowSpan，其余为 0）
    const seen = new Set<string>()
    return rows.map((r) => ({
      ...r,
      _yardRowSpan: seen.has(r.yardName) ? 0 : (seen.add(r.yardName), groupSizes.get(r.yardName) ?? 1),
    }))
  }, [rows])

  if (!loading && rows.length === 0) {
    return <Empty description="暂无月度数据" />
  }

  type DisplayRow = (typeof displayRows)[number]

  const columns: ColumnsType<DisplayRow> = [
    {
      title: '园区',
      key: 'yard',
      width: 100,
      fixed: 'left',
      render: (_, r) => (
        <span style={{ fontWeight: 500 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1677ff',
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          />
          {r.yardName}
        </span>
      ),
      onCell: (r) => ({ rowSpan: r._yardRowSpan }),
    },
    {
      title: '月份',
      key: 'month',
      width: 110,
      render: (_, r) => (
        <Tooltip title={r.monthStart.format('YYYY-MM-DD')} placement="topLeft">
          <span style={{ fontWeight: 500 }}>{r.monthLabel}</span>
        </Tooltip>
      ),
    },
    {
      title: '调车需求(辆)',
      key: 'demand',
      width: 130,
      align: 'right' as const,
      render: (_, r) => <span style={{ fontWeight: 500 }}>{r.demand}</span>,
    },
    {
      title: '未按时到场(辆)',
      key: 'lateArrival',
      width: 140,
      align: 'right' as const,
      render: (_, r) => {
        if (r.demand === 0) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tooltip title="enteredAt - expectedLoadTime > 30min">
            <span style={{ color: r.lateArrival > 0 ? '#fa8c16' : undefined }}>
              {r.lateArrival}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: '及时到场率',
      key: 'arrivalRate',
      width: 120,
      align: 'center' as const,
      render: (_, r) => {
        if (r.arrivalRate === null) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tag color={r.arrivalRate >= 80 ? 'green' : 'red'}>
            {r.arrivalRate}%
          </Tag>
        )
      },
    },
    {
      title: '未达成4小时装货(辆)',
      key: 'lateLoading',
      width: 160,
      align: 'right' as const,
      render: (_, r) => {
        if (r.demand === 0) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tooltip title="YardTimeline.effectiveLoadMin > 4h">
            <span style={{ color: r.lateLoading > 0 ? '#fa8c16' : undefined }}>
              {r.lateLoading}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: '4小时装货达成率',
      key: 'loadingRate',
      width: 150,
      align: 'center' as const,
      render: (_, r) => {
        if (r.loadingRate === null) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tag color={r.loadingRate >= 80 ? 'green' : 'red'}>
            {r.loadingRate}%
          </Tag>
        )
      },
    },
  ]

  return (
    <Table<DisplayRow>
      rowKey={(r) => `${r.yardId}-${r.monthLabel}`}
      dataSource={displayRows}
      columns={columns}
      pagination={false}
      size="middle"
      loading={loading}
      bordered
    />
  )
}