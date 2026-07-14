/**
 * 按公司 × 运输方向 透视表组件（M2.6 v0.8.0）
 *
 * 用途：在「按公司」Tab 展示按 (公司, 方向) 透视表(吸收原「按方向」Tab)。
 *
 * 设计要点：
 *  1. 8 列：公司(rowSpan 合并) / 路线 / 时效要求 / 应到数量 / 需求到场 /
 *     按时到场 / 及时装货完成 / 按时到货
 *  2. 公司行合并：rowSpan 实现（仅首条占位）
 *  3. 排序：公司字典序 → 方向字典序（由 utils 排序）
 *  4. 数据全部为绝对数（辆），无比率（用户截图样式）
 *  5. 0 值不显示 Tooltip（避免噪声）
 */
import { useMemo } from 'react'
import { Empty, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { CompanyDirectionRow } from '@/utils/efficiencyAnalysis'

interface Props {
  rows: CompanyDirectionRow[]
  loading?: boolean
}

export function CompanyDirectionPivot({ rows, loading }: Props) {
  // 计算公司 rowSpan
  const displayRows = useMemo(() => {
    const groupSizes = new Map<string, number>()
    for (const r of rows) {
      groupSizes.set(r.companyName, (groupSizes.get(r.companyName) ?? 0) + 1)
    }
    const seen = new Set<string>()
    return rows.map((r) => ({
      ...r,
      _companyRowSpan: seen.has(r.companyName)
        ? 0
        : (seen.add(r.companyName), groupSizes.get(r.companyName) ?? 1),
    }))
  }, [rows])

  if (!loading && rows.length === 0) {
    return <Empty description="暂无公司×方向数据" />
  }

  type DisplayRow = (typeof displayRows)[number]

  const columns: ColumnsType<DisplayRow> = [
    {
      title: '物流公司',
      key: 'company',
      width: 140,
      fixed: 'left',
      render: (_, r) => <span style={{ fontWeight: 500 }}>{r.companyName}</span>,
      onCell: (r) => ({ rowSpan: r._companyRowSpan }),
    },
    {
      title: '路线',
      key: 'direction',
      width: 100,
      render: (_, r) => <span style={{ fontWeight: 500 }}>{r.direction}</span>,
    },
    {
      title: '时效要求',
      key: 'sla',
      width: 100,
      align: 'center' as const,
      render: (_, r) => <span style={{ color: '#666' }}>{r.slaHours}h</span>,
    },
    {
      title: '应到数量',
      key: 'assigned',
      width: 110,
      align: 'right' as const,
      render: (_, r) => (
        <Tooltip title="被派车辆（status >= dispatched）">
          <span style={{ fontWeight: 500 }}>{r.assigned}</span>
        </Tooltip>
      ),
    },
    {
      title: '需求到场车辆',
      key: 'planned',
      width: 130,
      align: 'right' as const,
      render: (_, r) => (
        <Tooltip title="planned（expectedLoadTime ∈ 筛选时间范围）">
          <span style={{ fontWeight: 500 }}>{r.planned}</span>
        </Tooltip>
      ),
    },
    {
      title: '按时到场车辆',
      key: 'onTimeArrival',
      width: 130,
      align: 'right' as const,
      render: (_, r) => (
        <Tooltip title="isOnTimeArrival === true（30 分钟内）">
          <span style={{ color: r.onTimeArrival > 0 ? '#52c41a' : undefined }}>
            {r.onTimeArrival}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '及时装货完成车辆',
      key: 'onTimeLoading',
      width: 150,
      align: 'right' as const,
      render: (_, r) => (
        <Tooltip title="per YardTimeline，effectiveLoadMin ≤ 4h（标准4小时）">
          <span style={{ color: r.onTimeLoading > 0 ? '#52c41a' : undefined }}>
            {r.onTimeLoading}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '按时到货车辆',
      key: 'onTimeDelivery',
      width: 130,
      align: 'right' as const,
      render: (_, r) => (
        <Tooltip title={`isOnTimeDelivery === true（≤ ${r.slaHours}h SLA）`}>
          <span style={{ color: r.onTimeDelivery > 0 ? '#52c41a' : undefined }}>
            {r.onTimeDelivery}
          </span>
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<DisplayRow>
      rowKey={(r) => `${r.companyId}-${r.direction}`}
      dataSource={displayRows}
      columns={columns}
      pagination={false}
      size="middle"
      loading={loading}
      bordered
      scroll={{ x: 1000 }}
    />
  )
}