import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Descriptions, Card, Tag, Button, Row, Col, Empty, Space, Steps, Alert,
  Modal, Form, Select, Radio, Input, message, Image, QRCode, Typography,
} from 'antd'
const { Text } = Typography
import {
  ArrowLeftOutlined, TruckOutlined, EnvironmentOutlined,
  CheckCircleOutlined, InboxOutlined,
} from '@ant-design/icons'
import { PageContainer, renderYardNames, StatusTag, DISPATCH_STATUS_MAP } from '@/components'
import { useDispatchStore, useDictStore, useAuthStore } from '@/stores'
import type { DispatchStatus } from '@/types'
import {
  SHIPPING_METHOD_LABEL, SHIPPING_METHOD_COLOR, TRUCK_SIZE_LABEL,
  VOID_REASON_OPTIONS, VOID_REASON_LABEL,
} from '@/types/dispatch'
import type { Dispatch } from '@/types/dispatch'
import { ORDER_BOARD_COLUMNS, ORDER_STATUS_OPTIONS } from '@/types/order'
import { deriveOrderStatus, orderSubStatusLabel } from '@/utils/orderStatus'
import { formatDateTime, nowIsoString } from '@/utils'
import { H5_BASE_URL } from '@/utils/h5BaseUrl'
import { generateSignToken, buildSignUrl, getTokenRemainingHours } from '@/utils/signToken'
import { copyToClipboard } from '@/utils/clipboard'
import { GoodsTable } from '@/features/marketing/dispatch/components/GoodsTable'
import { YardTimelineView } from '@/features/warehouse/components/YardTimelineView'
import { NotifyLoadingModal } from '@/features/warehouse/components/NotifyLoadingModal'
import { DevActions } from '@/devtools/DevActions'

/**
 * 统一订单详情页（v0.2.0-M2：到货处理完整链路）
 *
 * 状态流转操作（按 dispatch.status switch）：
 *  - pending_confirm: 确认受理 / 取消订单
 *  - dispatched:      通知出发（弹 NotifyDepartModal，H5 推送）
 *  - entering:        通知装货（库房主动推进 loading）
 *  - loading:         装货完成（库房主动推进 leaving）
 *  - leaving:         等待 GPS 离厂（仅 Tag）
 *  - in_transit:      演示：GPS 入客户园区（mock 演示按钮）
 *  - arrived_by_gps:  等待司机在 H5 手动确认
 *  - driver_confirmed: 生成签收链接（PC token URL → 客户扫码）
 *  - customer_signed: 已签收，等待系统自动 completed
 *  - completed/cancelled: 仅 Tag
 */
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    list, load, save, markLoadingCompleted,
  } = useDispatchStore()
  const { yards, vehicles, drivers, loadYards, loadVehicles, loadDrivers } = useDictStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [dispatchForm] = Form.useForm()
  const [voidModalOpen, setVoidModalOpen] = useState(false)
  const [voidForm] = Form.useForm<{ reasonKey: string; reasonText?: string }>()
  const [departOpen, setDepartOpen] = useState(false)
  // —— v0.2.0-M2：签收链接 Modal ——
  const [signUrlOpen, setSignUrlOpen] = useState(false)
  const [signUrl, setSignUrl] = useState<string>('')
  const [signTokenTtl, setSignTokenTtl] = useState<number>(0)

  useEffect(() => {
    if (!list.length) load()
    loadYards()
    loadVehicles()
    loadDrivers()
  }, [list.length, load, loadYards, loadVehicles, loadDrivers])

  const record = useMemo(() => list.find((d) => d.id === id), [list, id])

  /** 当前进行中的园区（第一个未离场） */
  const activeYard = useMemo(
    () => record?.yardTimelines?.find((y) => !y.leftAt) ?? null,
    [record],
  )

  if (!record) {
    return (
      <PageContainer title="订单详情">
        <Empty description="订单不存在或已删除" />
      </PageContainer>
    )
  }

  const orderStatus = deriveOrderStatus(record)
  const orderOpt = ORDER_STATUS_OPTIONS.find((o) => o.value === orderStatus)
  const boardIndex = ORDER_BOARD_COLUMNS.indexOf(orderStatus)

  // —— 状态流转操作 ——

  const handleConfirm = async () => {
    await save({ ...record, status: 'confirmed' as DispatchStatus, confirmedAt: nowIsoString() })
    message.success('已确认受理')
  }

  const handleCancel = async () => {
    await save({ ...record, status: 'cancelled' as DispatchStatus })
    message.success('已取消订单')
  }

  const handleDispatch = async () => {
    try {
      const values = await dispatchForm.validateFields()
      const vehicle = vehicles.find((v) => v.id === values.vehicleId)
      const driver = drivers.find((d) => d.id === values.driverId)
      await save({
        ...record,
        status: 'dispatched' as DispatchStatus,
        vehicleId: vehicle?.id,
        vehicleNo: vehicle?.plateNo,
        driverId: driver?.id,
        driverName: driver?.name,
        dispatcherName: values.dispatcherName,
        dispatchedAt: nowIsoString(),
      })
      message.success('派车成功')
      setDispatchModalOpen(false)
    } catch {
      // 校验失败
    }
  }

  /** 库房"装货完成" */
  const handleLoadingComplete = async () => {
    if (!activeYard) return
    await markLoadingCompleted(record.id, activeYard.yardId, nowIsoString())
    message.success(`已标记 ${activeYard.yardName || activeYard.yardId} 装货完成`)
  }

  // ====== v0.2.0-M2：到货处理 4 步 ======

  /** 生成客户签收链接（仅 driver_confirmed 状态） */
  const handleGenerateSignUrl = () => {
    const token = generateSignToken(record.id, 24)
    const url = buildSignUrl(token, H5_BASE_URL)
    setSignUrl(url)
    setSignTokenTtl(getTokenRemainingHours(JSON.parse(
      decodeURIComponent(escape(atob(token))),
    )))
    setSignUrlOpen(true)
  }

  const handleVoidSubmit = async () => {
    if (!currentUser) return
    try {
      const { reasonKey, reasonText } = await voidForm.validateFields()
      const reason = reasonKey === 'other' ? (reasonText || '').trim() : VOID_REASON_LABEL[reasonKey] || reasonKey
      await save({
        ...record,
        status: 'cancelled' as DispatchStatus,
        voidedAt: nowIsoString(),
        voidedById: currentUser.id,
        voidedByName: currentUser.realName,
        voidReason: reason,
      })
      message.success('已作废')
      setVoidModalOpen(false)
    } catch {
      // 校验失败
    }
  }

  /** 按当前状态渲染角色化操作按钮 */
  const renderActions = () => {
    switch (record.status) {
      case 'pending_confirm':
        return (
          <Space>
            <Button type="primary" onClick={handleConfirm}>确认受理</Button>
            <Button danger onClick={handleCancel}>取消订单</Button>
          </Space>
        )
      case 'confirmed':
      case 'dispatching':
        return (
          <Space>
            <Button type="primary" onClick={() => { dispatchForm.resetFields(); setDispatchModalOpen(true) }}>
              派车
            </Button>
            <Button danger onClick={() => { voidForm.resetFields(); voidForm.setFieldsValue({ reasonKey: 'order_error' }); setVoidModalOpen(true) }}>
              作废
            </Button>
          </Space>
        )
      case 'dispatched':
        return (
          <Space>
            <Tooltip title="真实阶段：车辆硬件 GPS 入园后系统自动转 entering；mock 阶段：用下方「演示：GPS 入库」按钮模拟">
              <Tag color="cyan" icon={<EnvironmentOutlined />}>等待 GPS 入园</Tag>
            </Tooltip>
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      // v0.2.0-M2.2：库房员「通知装货」入口（entering 状态点）
      case 'entering':
        return (
          <Space>
            <Button type="primary" onClick={() => setDepartOpen(true)}>
              通知装货
            </Button>
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      case 'loading':
        return <Button type="primary" onClick={handleLoadingComplete}>装货完成</Button>
      case 'leaving':
        return (
          <Space>
            <StatusTag value="leaving" map={DISPATCH_STATUS_MAP} />
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      // ====== v0.2.0-M2：到货处理 4 步 ======
      case 'in_transit':
        return (
          <Space>
            <Tag color="gold" icon={<TruckOutlined />}>在途中</Tag>
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      case 'arrived_by_gps':
        return (
          <Space>
            <Tag color="lime" icon={<EnvironmentOutlined />}>已到客户园区</Tag>
            <Tag color="orange">等待司机 H5 确认</Tag>
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      case 'driver_confirmed':
        return (
          <Space>
            <Tag color="cyan" icon={<CheckCircleOutlined />}>司机已确认到达</Tag>
            {/* 链接已在 leaving 状态由库房员生成（v0.2.0-M2 流程改进）；演示签收按钮收归 DevActions */}
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      case 'customer_signed':
        return (
          <Space>
            <Tag color="green" icon={<InboxOutlined />}>已签收（订单即将完成）</Tag>
          </Space>
        )
      case 'completed':
        return <StatusTag value="completed" map={DISPATCH_STATUS_MAP} />
      case 'cancelled':
        return <StatusTag value="cancelled" map={DISPATCH_STATUS_MAP} />
      default:
        return null
    }
  }

  return (
    <PageContainer
      title={`订单详情 - ${record.dispatchNo}`}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      }
    >
      {/* 订单主状态进度条 + 操作区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            {orderStatus === 'cancelled' || orderStatus === 'draft' ? (
              <Space>
                <span>订单主状态：</span>
                <Tag color={orderOpt?.color}>{orderOpt?.emoji} {orderOpt?.label}</Tag>
                <span style={{ color: '#999' }}>当前子状态</span>
                <StatusTag value={record.status} map={DISPATCH_STATUS_MAP} />
              </Space>
            ) : (
              <Steps
                size="small"
                current={boardIndex}
                items={ORDER_BOARD_COLUMNS.map((c) => {
                  const o = ORDER_STATUS_OPTIONS.find((x) => x.value === c)!
                  return {
                    title: o.label,
                    description: c === orderStatus ? orderSubStatusLabel(record) : o.dept,
                  }
                })}
              />
            )}
          </Col>
          <Col>
            <Space direction="vertical" align="end" size={4}>
              <span style={{ fontSize: 12, color: '#999' }}>推进部门：{orderOpt?.dept}</span>
              {renderActions()}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单编号">{record.dispatchNo}</Descriptions.Item>
              <Descriptions.Item label="当前子状态">
                <StatusTag value={record.status} map={DISPATCH_STATUS_MAP} />
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
                {record.isCarpool && <Tag color="purple">拼车</Tag>}
                {record.isUrgent && <Tag color="red">紧急</Tag>}
                {!record.isCarpool && !record.isUrgent && '-'}
              </Descriptions.Item>
              <Descriptions.Item label="车辆">{record.vehicleNo || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="司机">{record.driverName || '未派车'}</Descriptions.Item>
              <Descriptions.Item label="调车员">{record.dispatcherName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{record.creatorName}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{formatDateTime(record.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{record.remark || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`货物清单（${record.goods.length}）`} size="small">
            <GoodsTable goods={record.goods} />
          </Card>

          {/* v0.2.0-M2：签收照片独立卡片（客户签收后显示） */}
          {(() => {
            const firstTl = record.yardTimelines?.[0]
            const photos = firstTl?.signaturePhotos || []
            const hasSigned = !!firstTl?.signedAt
            return (
              <Card
                title={
                  <Space>
                    <Text strong>签收照片</Text>
                    {photos.length > 0 ? (
                      <Tag color="green">{photos.length} 张</Tag>
                    ) : hasSigned ? (
                      <Tag color="orange">已签收但无照片</Tag>
                    ) : (
                      <Tag>未签收</Tag>
                    )}
                  </Space>
                }
                size="small"
                style={{ marginTop: 16 }}
              >
                {photos.length > 0 ? (
                  <>
                    <Image.PreviewGroup>
                      <Row gutter={[12, 12]}>
                        {photos.map((url, i) => (
                          <Col key={i} span={8}>
                            <Image
                              src={url}
                              alt={`签收照片 ${i + 1}`}
                              width="100%"
                              height={120}
                              style={{ objectFit: 'cover', borderRadius: 4 }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Image.PreviewGroup>
                    {firstTl.signatureNote && (
                      <Alert
                        style={{ marginTop: 12 }}
                        type="info"
                        showIcon
                        message={
                          <Space>
                            <Text strong>签收备注：</Text>
                            <Text>{firstTl.signatureNote}</Text>
                          </Space>
                        }
                      />
                    )}
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      签收时间：{formatDateTime(firstTl.signedAt!)}
                    </div>
                  </>
                ) : hasSigned ? (
                  <Alert type="warning" showIcon message="客户已签收但未上传照片" />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="客户尚未签收；链接生成后客户扫码可上传照片"
                  />
                )}
              </Card>
            )
          })()}
        </Col>

        <Col span={8}>
          <Card title="履约时间轴" size="small">
            {(record.yardTimelines?.length ?? 0) > 0 ? (
              <YardTimelineView dispatch={record} />
            ) : (
              <Alert type="info" showIcon message="尚未进入园区履约阶段" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 派车 Modal（复用派车调度页逻辑） */}
      <Modal
        title={`派车 - ${record.dispatchNo}`}
        open={dispatchModalOpen}
        onCancel={() => setDispatchModalOpen(false)}
        onOk={handleDispatch}
        okText="确认派车"
        width={600}
      >
        <Form form={dispatchForm} layout="vertical">
          <Form.Item name="vehicleId" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select
              placeholder="请选择车辆"
              showSearch
              optionFilterProp="label"
              options={vehicles
                .filter((v) => v.status === 'enabled' && (!record.companyId || v.companyId === record.companyId))
                .map((v) => ({ value: v.id, label: `${v.plateNo}（${v.maxLoad}t / ${v.length}m）` }))}
            />
          </Form.Item>
          <Form.Item name="driverId" label="选择司机" rules={[{ required: true, message: '请选择司机' }]}>
            <Select
              placeholder="请选择司机"
              showSearch
              optionFilterProp="label"
              options={drivers
                .filter((d) => d.status === 'enabled' && (!record.companyId || d.companyId === record.companyId))
                .map((d) => ({ value: d.id, label: `${d.name}（${d.phone}）` }))}
            />
          </Form.Item>
          <Form.Item name="dispatcherName" label="调车员（备注）">
            <Select
              placeholder="可选"
              allowClear
              options={[{ value: '周文', label: '周文' }, { value: '吴峰', label: '吴峰' }]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 作废 Modal */}
      <Modal
        title={`作废订单 - ${record.dispatchNo}`}
        open={voidModalOpen}
        onCancel={() => setVoidModalOpen(false)}
        onOk={handleVoidSubmit}
        okText="确认作废"
        okButtonProps={{ danger: true }}
      >
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="作废后订单进入「已取消」，不可恢复。" />
        <Form form={voidForm} layout="vertical">
          <Form.Item name="reasonKey" label="作废原因" rules={[{ required: true, message: '请选择原因' }]}>
            <Radio.Group>
              <Space direction="vertical">
                {VOID_REASON_OPTIONS.map((o) => (
                  <Radio key={o.value} value={o.value}>{o.label}</Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.reasonKey !== cur.reasonKey}
          >
            {({ getFieldValue }) =>
              getFieldValue('reasonKey') === 'other' ? (
                <Form.Item name="reasonText" label="请填写具体原因" rules={[{ required: true, message: '请填写原因' }]}>
                  <Input.TextArea rows={2} placeholder="请输入作废原因" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* 通知装货 Modal（v0.2.0-M2.2：库房员在 entering 状态点） */}
      <NotifyLoadingModal
        open={departOpen}
        dispatch={record}
        yardId={activeYard?.yardId || null}
        yardName={activeYard?.yardName}
        onClose={() => setDepartOpen(false)}
      />

      {/* v0.2.0-M2：客户签收链接 Modal（含二维码） */}
      <Modal
        title={`客户签收链接 - ${record.dispatchNo}`}
        open={signUrlOpen}
        onCancel={() => setSignUrlOpen(false)}
        footer={[
          <Button key="copy" type="primary" onClick={async () => {
            const ok = await copyToClipboard(signUrl)
            if (ok) message.success('链接已复制到剪贴板')
            else message.error('复制失败，请手动选中链接复制')
          }}>
            复制链接
          </Button>,
          <Button key="open" onClick={() => window.open(signUrl, '_blank')}>
            在新窗口打开
          </Button>,
          <Button key="close" onClick={() => setSignUrlOpen(false)}>关闭</Button>,
        ]}
        width={560}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="将链接通过微信/短信发给客户；或让客户扫码。客户在手机上打开即可查看订单 + 上传照片 + 完成签收。"
        />
        <Row gutter={16}>
          <Col span={13}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>签收链接</Text>
            <Input.TextArea
              value={signUrl}
              readOnly
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>有效期：</Text>
              <Tag color="blue">{signTokenTtl} 小时</Tag>
            </div>
          </Col>
          <Col span={11}>
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>扫码访问</Text>
              <div style={{
                display: 'inline-block',
                padding: 8,
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}>
                <QRCode value={signUrl} size={140} />
              </div>
            </div>
          </Col>
        </Row>
      </Modal>
    </PageContainer>
  )
}
