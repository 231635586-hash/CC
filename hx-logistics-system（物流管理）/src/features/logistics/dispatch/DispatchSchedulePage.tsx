import { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Table, Tag, Button, Space, Modal, Form, Select, message, Statistic, Empty, Tooltip } from 'antd'
import { TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { PageContainer } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import type { Dispatch } from '@/types/dispatch'

/** 派车调度 - 按方向+时间聚类展示 */
export function DispatchSchedulePage() {
  const { list, load, save } = useDispatchStore()
  const { vehicles, yards, loadVehicles, loadCompanies, loadYards } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [active, setActive] = useState<Dispatch | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    load()
    loadVehicles()
    loadCompanies()
    loadYards()
  }, [load, loadVehicles, loadCompanies, loadYards])

  /** UI 层兜底：按 yardId 实时查表，避免依赖 yardName 字段 */
  const renderYardName = (yardId: string, fallback: string) => {
    const hit = yards.find((y) => y.id === yardId)
    return hit?.name || fallback || '-'
  }

  // 待派车 = 已确认 + 已派车
  const pending = useMemo(() => list.filter((d) => d.status === 'confirmed'), [list])
  const inProgress = useMemo(() => list.filter((d) => ['dispatched', 'entering', 'loading', 'leaving'].includes(d.status)), [list])
  const completed = useMemo(() => list.filter((d) => d.status === 'completed'), [list])

  const handleOpen = (record: Dispatch) => {
    setActive(record)
    form.resetFields()
    setModalOpen(true)
  }

  const handleDispatch = async () => {
    if (!active) return
    try {
      const values = await form.validateFields()
      const vehicle = vehicles.find((v) => v.id === values.vehicleId)
      await save({
        ...active,
        status: 'dispatched' as DispatchStatus,
        vehicleId: vehicle?.id,
        vehicleNo: vehicle?.plateNo,
        dispatcherId: values.dispatcherId,
        dispatcherName: values.dispatcherId,
        dispatchedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      message.success('派车成功')
      setModalOpen(false)
    } catch {
      // 校验失败
    }
  }

  // 同行拼车组（同公司+同方向+同时段）
  const grouped = useMemo(() => {
    const map = new Map<string, Dispatch[]>()
    pending.forEach((d) => {
      const key = `${d.companyId}-${d.direction}-${d.expectedLoadTime.slice(0, 13)}`
      const arr = map.get(key) || []
      arr.push(d)
      map.set(key, arr)
    })
    return Array.from(map.entries())
  }, [pending])

  return (
    <PageContainer title="派车调度看板">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="待派车" value={pending.length} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运输中" value={inProgress.length} prefix={<TruckOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日已完成" value={completed.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="可派车辆" value={vehicles.filter((v) => v.status === 'enabled').length} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card title="待派车（按方向+时间聚类，相同维度可拼车）" size="small" style={{ marginBottom: 16 }}>
        {grouped.length === 0 ? (
          <Empty description="暂无待派车单" />
        ) : (
          grouped.map(([key, items]) => {
            const first = items[0]
            return (
              <Card
                key={key}
                type="inner"
                size="small"
                title={
                  <Space>
                    <Tag color="blue">{items[0].companyName}</Tag>
                    <Tag>服务方向：{first.direction}</Tag>
                    <Tag color="cyan">时段：{first.expectedLoadTime.slice(0, 13)}:00</Tag>
                    {items.length > 1 && <Tag color="purple">拼车 {items.length} 单</Tag>}
                  </Space>
                }
                style={{ marginBottom: 12 }}
              >
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={items}
                  pagination={false}
                  columns={[
                    { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
                    { title: '园区', dataIndex: 'yardId', width: 140, render: (id: string, r: Dispatch) => renderYardName(id, r.yardName) },
                    {
                      title: '货物',
                      dataIndex: 'goods',
                      render: (g: Dispatch['goods']) =>
                        g?.map((x) => `${x.goodsName}×${x.quantity}`).join('；') || '-',
                    },
                    { title: '期望装货', dataIndex: 'expectedLoadTime', width: 160 },
                    { title: '创建人', dataIndex: 'creatorName', width: 100 },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, r) => (
                        <Button type="primary" size="small" onClick={() => handleOpen(r)}>
                          派车
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            )
          })
        )}
      </Card>

      <Card title="运输中" size="small">
        <Table
          size="small"
          rowKey="id"
          dataSource={inProgress}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无" /> }}
          columns={[
            { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s: DispatchStatus) => {
                const opt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === s)
                return <Tag color={opt?.color}>{opt?.label}</Tag>
              },
            },
            { title: '车辆', dataIndex: 'vehicleNo', width: 100 },
            { title: '司机', dataIndex: 'driverName', width: 100 },
            { title: '园区', dataIndex: 'yardId', width: 140, render: (id: string, r: Dispatch) => renderYardName(id, r.yardName) },
            { title: '派车时间', dataIndex: 'dispatchedAt', width: 160 },
          ]}
        />
      </Card>

      <Modal
        title={`派车 - ${active?.dispatchNo || ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleDispatch}
        okText="确认派车"
        width={600}
      >
        {active && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <Space wrap>
                <Tag color="blue">{active.companyName}</Tag>
                <Tag>{active.direction}</Tag>
                <Tag color="cyan">{active.yardName}</Tag>
                <Tag color="orange">{active.expectedLoadTime}</Tag>
              </Space>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="vehicleId"
                label="选择车辆"
                rules={[{ required: true, message: '请选择车辆' }]}
              >
                <Select
                  placeholder="请选择车辆"
                  showSearch
                  optionFilterProp="label"
                  options={vehicles
                    .filter((v) => v.companyId === active.companyId && v.status === 'enabled')
                    .map((v) => ({
                      value: v.id,
                      label: `${v.plateNo} (${v.vehicleType === 'heavy' ? '重型' : v.vehicleType === 'medium' ? '中型' : '轻型'} / ${v.maxLoad}吨)`,
                    }))}
                />
              </Form.Item>
              <Form.Item
                name="driverId"
                label="选择司机"
                rules={[{ required: true, message: '请选择司机' }]}
              >
                <Select
                  placeholder="请选择司机"
                  showSearch
                  optionFilterProp="label"
                  options={[] as { value: string; label: string }[]}
                />
              </Form.Item>
              <Form.Item name="dispatcherId" label="调车员（备注）">
                <Select
                  placeholder="可选"
                  allowClear
                  options={[
                    { value: '周文', label: '周文' },
                    { value: '吴峰', label: '吴峰' },
                  ]}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </PageContainer>
  )
}
