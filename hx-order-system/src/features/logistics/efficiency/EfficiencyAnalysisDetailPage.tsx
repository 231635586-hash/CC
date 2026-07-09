import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Empty, Spin, Space, Statistic, Row, Col, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer } from '@/components'
import { useDispatchStore } from '@/stores'
import { analyzeDispatchEfficiency, formatMinutesAsHour } from '@/utils/efficiencyAnalysis'
import { YardMetricsCard } from './components/YardMetricsCard'

/** 调度时效分析详情页 */
export function EfficiencyAnalysisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { list } = useDispatchStore()

  const dispatch = list.find((d) => d.id === id)
  const analysis = useMemo(() => (dispatch ? analyzeDispatchEfficiency(dispatch) : null), [dispatch])

  if (!dispatch) {
    return (
      <PageContainer title="调度时效分析">
        <Card>
          <Spin tip="加载中..." />
        </Card>
      </PageContainer>
    )
  }

  if (!analysis) {
    return (
      <PageContainer title={`调度时效分析 - ${dispatch.dispatchNo}`}>
        <Empty description="该调车单时间戳不全，无法分析（需要至少一园区包含 queuedAt/enteredAt/loadingCompletedAt）" />
      </PageContainer>
    )
  }

  const avgMin = analysis.yards.length > 0
    ? Math.round(analysis.totalEffectiveLoadMin / analysis.yards.length)
    : 0

  return (
    <PageContainer
      title={`调度时效分析 - ${dispatch.dispatchNo}`}
      extra={
        <Space>
          <Button onClick={() => navigate('/logistics/efficiency')}>返回列表</Button>
          <Button type="primary" onClick={() => navigate(`/marketing/dispatch/${dispatch.id}`)}>
            查看原调车单详情
          </Button>
        </Space>
      }
    >
      {/* 基本信息 */}
      <Card title="基本信息" size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="调车编号">{analysis.dispatchNo}</Descriptions.Item>
          <Descriptions.Item label="物流公司">{analysis.companyName}</Descriptions.Item>
          <Descriptions.Item label="车牌 / 司机">
            {analysis.vehicleNo || '-'} / {analysis.driverName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="园区数">{analysis.yardCount}</Descriptions.Item>
          <Descriptions.Item label="总装货用时">
            <Tag color="blue">{formatMinutesAsHour(analysis.totalEffectiveLoadMin)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="总超时">
            {analysis.isOvertime ? (
              <Tag color="red">+{formatMinutesAsHour(analysis.totalOvertimeMin)}</Tag>
            ) : (
              <Tag color="green">未超时</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="最终出厂时间">{analysis.finalExitTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="平均每园区用时">{formatMinutesAsHour(avgMin)}</Descriptions.Item>
          <Descriptions.Item label="分析生成时间">{analysis.generatedAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 汇总警告 */}
      {analysis.isOvertime && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`共 ${analysis.yards.filter((y) => y.isOvertime).length} / ${analysis.yards.length} 个园区超时`}
          description="可进入各园区卡片查看具体超时原因与责任部门"
        />
      )}

      {/* 每园区指标卡 */}
      <Card title="各园区调度时效" size="small">
        {analysis.yards.length === 0 ? (
          <Empty description="暂无园区指标" />
        ) : (
          analysis.yards.map((m, i) => <YardMetricsCard key={m.yardId} metric={m} index={i} />)
        )}
      </Card>
    </PageContainer>
  )
}