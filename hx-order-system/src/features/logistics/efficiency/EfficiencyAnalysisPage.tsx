import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, Empty, Tooltip } from 'antd'
import { ReloadOutlined, EyeOutlined, ClockCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { PageContainer, SCROLL_PRESETS } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import type { Dispatch } from '@/types/dispatch'
import { analyzeDispatchEfficiency, formatMinutesAsHour } from '@/utils/efficiencyAnalysis'
import type { DispatchEfficiency } from '@/types/dispatch'

/**
 * 调度时效分析列表页（M2）
 *
 * - 4 统计：已完成单数 / 平均装货用时 / 超时单数 / 超时率
 * - 表格：调车编号 / 公司 / 园区数 / 总装货用时 / 超时分钟 / 最终出厂 / 操作
 * - 点击【详情】跳到 /logistics/efficiency/:id
 */
export function EfficiencyAnalysisPage() {
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { companies, loadCompanies } = useDictStore()

  useEffect(() => {
    load()
    loadCompanies()
  }, [load, loadCompanies])

  // 计算所有已完成调车单的时效分析
  const analyses = useMemo<DispatchEfficiency[]>(() => {
    const result: DispatchEfficiency[] = []
    for (const d of list) {
      if (d.status !== 'completed') continue
      const a = analyzeDispatchEfficiency(d)
      if (a) result.push(a)
    }
    return result
  }, [list])

  const stats = useMemo(() => {
    const completed = analyses.length
    const totalMin = analyses.reduce((s, a) => s + a.totalEffectiveLoadMin, 0)
    const avgMin = completed > 0 ? Math.round(totalMin / completed) : 0
    const overtime = analyses.filter((a) => a.isOvertime).length
    const overtimeRate = completed > 0 ? Math.round((overtime / completed) * 100) : 0
    return { completed, avgMin, overtime, overtimeRate }
  }, [analyses])

  return (
    <PageContainer
      title="调度时效分析"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          手动刷新
        </Button>
      }
    >
      {/* 顶部 4 统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成单数"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均装货用时"
              value={formatMinutesAsHour(stats.avgMin)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超时单数"
              value={stats.overtime}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超时率"
              value={`${stats.overtimeRate}%`}
              valueStyle={{ color: stats.overtimeRate > 30 ? '#cf1322' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 表格 */}
      <Card>
        <Table<DispatchEfficiency>
          rowKey="dispatchId"
          dataSource={analyses}
          locale={{ emptyText: <Empty description="暂无已完成调车单数据" /> }}
          columns={[
            {
              title: '调车编号',
              dataIndex: 'dispatchNo',
              width: 150,
              render: (no: string, r) => (
                <a onClick={() => navigate(`/logistics/efficiency/${r.dispatchId}`)}>{no}</a>
              ),
            },
            { title: '公司', dataIndex: 'companyName', width: 200, ellipsis: true },
            {
              title: '园区数',
              dataIndex: 'yardCount',
              width: 80,
              align: 'center',
            },
            {
              title: '总装货用时',
              dataIndex: 'totalEffectiveLoadMin',
              width: 130,
              render: (min: number) => (
                <span style={{ fontWeight: 500 }}>{formatMinutesAsHour(min)}</span>
              ),
            },
            {
              title: '总超时',
              dataIndex: 'totalOvertimeMin',
              width: 110,
              render: (min: number, r) => {
                if (min <= 0) return <Tag color="green">未超时</Tag>
                return (
                  <Tooltip title="超出标准用时（4h）的总分钟数">
                    <Tag color="red">+{formatMinutesAsHour(min)}</Tag>
                  </Tooltip>
                )
              },
            },
            {
              title: '最终出厂时间',
              dataIndex: 'finalExitTime',
              width: 160,
              render: (t?: string) => t || '-',
            },
            {
              title: '操作',
              fixed: 'right',
              width: 100,
              render: (_, r) => (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/logistics/efficiency/${r.dispatchId}`)}
                >
                  详情
                </Button>
              ),
            },
          ]}
          scroll={{ x: SCROLL_PRESETS.narrow }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </PageContainer>
  )
}