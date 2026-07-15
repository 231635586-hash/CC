import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Card, Tag, Timeline, Button, Row, Col, Empty } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer, renderYardNames, DispatchFlowHeader, BoolTags } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import { SHIPPING_METHOD_LABEL, SHIPPING_METHOD_COLOR, TRUCK_SIZE_LABEL } from '@/types/dispatch'
import { GoodsTable } from './components/GoodsTable'
import { formatDateTime } from '@/utils'

/** 调车单详情页 */
export function DispatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { yards, loadYards } = useDictStore()

  useEffect(() => {
    if (!list.length) load()
    loadYards()
  }, [list.length, load, loadYards])

  const record = list.find((d) => d.id === id)

  if (!record) {
    return (
      <PageContainer title="调车单详情">
        <Empty description="调车单不存在或已删除" />
      </PageContainer>
    )
  }

  const statusOpt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === record.status)

  return (
    <PageContainer
      title={`调车单详情 - ${record.dispatchNo}`}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      }
    >
      {/* 统一流程栏（顶部：4 步进度 + 推进部门 + 角色化操作区） */}
      <DispatchFlowHeader dispatch={record} />

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="调车编号">{record.dispatchNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusOpt?.color}>{statusOpt?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务方向">{record.direction || '-'}</Descriptions.Item>
              <Descriptions.Item label="期望装货时间">{formatDateTime(record.expectedLoadTime)}</Descriptions.Item>
              <Descriptions.Item label="物流公司">{record.companyName}</Descriptions.Item>
              <Descriptions.Item label="园区">
                {renderYardNames(record.yardIds, record.primaryYardId, yards)}
              </Descriptions.Item>
              <Descriptions.Item label="发运方式">
                {record.shippingMethod ? (
                  <Tag color={SHIPPING_METHOD_COLOR[record.shippingMethod]}>
                    {SHIPPING_METHOD_LABEL[record.shippingMethod]}
                    {record.truckSize && ` / ${TRUCK_SIZE_LABEL[record.truckSize]}`}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="拼车 / 紧急">
                <BoolTags isUrgent={record.isUrgent} isCarpool={record.isCarpool} />
              </Descriptions.Item>
              <Descriptions.Item label="车辆">{record.vehicleNo || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="司机">{record.driverName || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="调车员">{record.dispatcherName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{record.creatorName}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(record.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {record.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`货物清单（${record.goods.length}）`} size="small">
            <GoodsTable goods={record.goods} />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="状态流转时间轴" size="small">
            <Timeline
              items={[
                { color: 'green', children: <span>创建于 {formatDateTime(record.createdAt)}</span> },
                ...(record.confirmedAt
                  ? [{ color: 'blue', children: <span>已确认 {formatDateTime(record.confirmedAt)}</span> }]
                  : []),
                ...(record.dispatchedAt
                  ? [{ color: 'cyan', children: <span>已派车 {formatDateTime(record.dispatchedAt)}</span> }]
                  : []),
                ...(record.enterYardAt
                  ? [{ color: 'geekblue', children: <span>已入园 {formatDateTime(record.enterYardAt)}</span> }]
                  : []),
                ...(record.leaveYardAt
                  ? [{ color: 'purple', children: <span>已出场 {formatDateTime(record.leaveYardAt)}</span> }]
                  : []),
                ...(record.completedAt
                  ? [{ color: 'green', children: <span>已完成 {formatDateTime(record.completedAt)}</span> }]
                  : []),
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
