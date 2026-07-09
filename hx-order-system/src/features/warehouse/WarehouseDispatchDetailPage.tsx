import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Empty, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer, DispatchFlowHeader } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import { GoodsTable } from '@/features/marketing/dispatch/components/GoodsTable'
import { YardTimelineView } from './components/YardTimelineView'
import { formatDateTime } from '@/utils'

/** 库房单据详情页 - 显示多园区时间线 */
export function WarehouseDispatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { yards, companies, loadYards, loadCompanies } = useDictStore()

  useEffect(() => {
    load()
    loadYards()
    loadCompanies()
  }, [load, loadYards, loadCompanies])

  const dispatch = list.find((d) => d.id === id)

  if (!dispatch) {
    return (
      <PageContainer title="调车单详情">
        <Card>
          <Spin tip="加载中..." />
        </Card>
      </PageContainer>
    )
  }

  const statusOpt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === dispatch.status)
  const yard = yards.find((y) => y.id === dispatch.primaryYardId)
  const company = companies.find((c) => c.id === dispatch.companyId)

  return (
    <PageContainer
      title={`库房详情 - ${dispatch.dispatchNo}`}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouse/queue')}>
          返回排队列表
        </Button>
      }
    >
      {/* 统一流程栏（顶部：4 步进度 + 推进部门 + 角色化操作区） */}
      <DispatchFlowHeader dispatch={dispatch} />

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="调车编号">{dispatch.dispatchNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusOpt?.color}>{statusOpt?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="方向">{dispatch.direction}</Descriptions.Item>
          <Descriptions.Item label="期望装货时间">{formatDateTime(dispatch.expectedLoadTime)}</Descriptions.Item>
          <Descriptions.Item label="物流公司">{company?.name || dispatch.companyName}</Descriptions.Item>
          <Descriptions.Item label="主园区">{yard?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="车牌">{dispatch.vehicleNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="司机">{dispatch.driverName || '-'}</Descriptions.Item>
          <Descriptions.Item label="发运方式">{dispatch.shippingMethod}</Descriptions.Item>
          <Descriptions.Item label="车型">{dispatch.truckSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{dispatch.creatorName}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(dispatch.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 货物清单 */}
      {dispatch.goods?.length > 0 && (
        <Card title={`货物清单（${dispatch.goods.length}）`} style={{ marginBottom: 16 }}>
          <GoodsTable goods={dispatch.goods} />
        </Card>
      )}

      {/* 多园区时间线 */}
      <Card title="多园区装货时间线">
        {dispatch.yardTimelines?.length > 0 ? (
          <YardTimelineView dispatch={dispatch} />
        ) : (
          <Empty description="暂无时间线数据" />
        )}
      </Card>
    </PageContainer>
  )
}