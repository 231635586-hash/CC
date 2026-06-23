import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Card, Tag, Timeline, Button, Space, Table, Row, Col, Empty } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer } from '@/components'
import { useDispatchStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import { DIRECTION_LABEL } from '@/utils'

/** 调车单详情页 */
export function DispatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()

  useEffect(() => {
    if (!list.length) load()
  }, [list.length, load])

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
      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="调车编号">{record.dispatchNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusOpt?.color}>{statusOpt?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="方向">{DIRECTION_LABEL[record.direction]}</Descriptions.Item>
              <Descriptions.Item label="期望装货时间">{record.expectedLoadTime}</Descriptions.Item>
              <Descriptions.Item label="物流公司">{record.companyName}</Descriptions.Item>
              <Descriptions.Item label="园区">{record.yardName}</Descriptions.Item>
              <Descriptions.Item label="车辆">{record.vehicleNo || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="司机">{record.driverName || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="调车员">{record.dispatcherName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{record.creatorName}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {record.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {record.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`货物清单（${record.goods.length}）`} size="small">
            <Table
              size="small"
              rowKey="id"
              dataSource={record.goods}
              pagination={false}
              columns={[
                { title: '货物名称', dataIndex: 'goodsName' },
                { title: '数量', dataIndex: 'quantity', width: 80 },
                { title: '单位', dataIndex: 'unit', width: 60 },
                { title: '重量(kg)', dataIndex: 'weight', width: 100 },
                { title: '客户', dataIndex: 'customerName' },
                { title: '目的地', dataIndex: 'destination' },
                { title: '备注', dataIndex: 'remark' },
              ]}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="状态流转时间轴" size="small">
            <Timeline
              items={[
                { color: 'green', children: <span>创建于 {record.createdAt}</span> },
                ...(record.confirmedAt
                  ? [{ color: 'blue', children: <span>已确认 {record.confirmedAt}</span> }]
                  : []),
                ...(record.dispatchedAt
                  ? [{ color: 'cyan', children: <span>已派车 {record.dispatchedAt}</span> }]
                  : []),
                ...(record.enterYardAt
                  ? [{ color: 'geekblue', children: <span>已入园 {record.enterYardAt}</span> }]
                  : []),
                ...(record.leaveYardAt
                  ? [{ color: 'purple', children: <span>已出场 {record.leaveYardAt}</span> }]
                  : []),
                ...(record.completedAt
                  ? [{ color: 'green', children: <span>已完成 {record.completedAt}</span> }]
                  : []),
              ]}
            />
          </Card>

          <Card title="M1 状态机说明" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {DISPATCH_STATUS_OPTIONS.map((s) => (
                <Tag key={s.value} color={s.color} style={{ width: '100%', textAlign: 'center' }}>
                  {s.label}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
