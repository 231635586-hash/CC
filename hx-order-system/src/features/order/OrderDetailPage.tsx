import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Descriptions, Card, Tag, Button, Row, Col, Empty, Space, Alert, Tooltip,
  Modal, Form, Select, Radio, Input, message, Typography,
} from 'antd'
const { Text } = Typography
import {
  ArrowLeftOutlined, TruckOutlined, EnvironmentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
// ❌ v0.3.0-M2.2 删除:QRCode / Image / InboxOutlined / copyToClipboard(客户签收全链路已下线)
import { PageContainer, renderYardNames, StatusTag, DISPATCH_STATUS_MAP, DispatchFlowHeader, DispatchVehicleModal, BoolTags } from '@/components'
import { useDispatchStore, useDictStore, useAuthStore } from '@/stores'
import type { DispatchStatus } from '@/types'
import {
  SHIPPING_METHOD_LABEL, SHIPPING_METHOD_COLOR, TRUCK_SIZE_LABEL,
  VOID_REASON_OPTIONS, VOID_REASON_LABEL,
} from '@/types/dispatch'
import type { Dispatch } from '@/types/dispatch'
import { formatDateTime, nowIsoString } from '@/utils'
import { GoodsTable } from '@/features/marketing/dispatch/components/GoodsTable'
import { YardTimelineView } from '@/features/warehouse/components/YardTimelineView'
import { NotifyLoadingModal } from '@/features/warehouse/components/NotifyLoadingModal'
import { DevActions } from '@/devtools/DevActions'

/**
 * 统一订单详情页（v0.3.0-M2.2：状态机 v2 - 移除客户签收）
 *
 * 状态流转操作（按 dispatch.status switch）：
 *  - pending_confirm: 确认受理 / 取消订单
 *  - dispatched:      等待 GPS / 司机扫码入场
 *  - queued:          等待库房员通知入场(Mock 道闸放行)
 *  - entering:        通知装货（库房主动推进 loading）
 *  - loading:         装货完成（库房主动推进 leaving）
 *  - leaving:         等待 GPS 离厂（仅 Tag）
 *  - in_transit:      在途中(司机 H5 可确认到达)
 *  - driver_confirmed: 司机已确认到达 → 链式 completed
 *  - completed/cancelled: 仅 Tag
 *
 * ❌ v0.3.0-M2.2 删除：
 *  - 客户签收链接 Modal（signUrl / 复制 / 二维码）
 *  - 签收照片 Card（signaturePhotos / signatureNote / signedAt）
 *  - arrived_by_gps / customer_signed 两个 case
 *  - 工具：H5_BASE_URL / generateSignToken / buildSignUrl / getTokenRemainingHours
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
  // 派车 Modal Form 由 <DispatchVehicleModal> 内部自管(无 useForm 必要)
  const [voidModalOpen, setVoidModalOpen] = useState(false)
  const [voidForm] = Form.useForm<{ reasonKey: string; reasonText?: string }>()
  const [departOpen, setDepartOpen] = useState(false)
  // ❌ v0.3.0-M2.2 删除：signUrlOpen / signUrl / signTokenTtl 状态

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

  // —— 状态流转操作 ——

  const handleConfirm = async () => {
    await save({ ...record, status: 'confirmed' as DispatchStatus, confirmedAt: nowIsoString() })
    message.success('已确认受理')
  }

  const handleCancel = async () => {
    await save({ ...record, status: 'cancelled' as DispatchStatus })
    message.success('已取消订单')
  }

  const handleDispatch = async (values: { vehicleId: string; driverId: string; dispatcherName?: string }) => {
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
  }

  /** 库房"装货完成" */
  const handleLoadingComplete = async () => {
    if (!activeYard) return
    await markLoadingCompleted(record.id, activeYard.yardId, nowIsoString())
    message.success(`已标记 ${activeYard.yardName || activeYard.yardId} 装货完成`)
  }

  // ====== v0.2.0-M2：到货处理 4 步 ======

  // ❌ v0.3.0-M2.2 删除:handleGenerateSignUrl(客户签收全链路已下线)

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
        return (
          <Space>
            <Button type="primary" onClick={() => setDispatchModalOpen(true)}>
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
            <Button type="primary" onClick={() => setDispatchModalOpen(true)}>
              重新派车
            </Button>
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
      // ❌ v0.3.0-M2.2 删除:case 'arrived_by_gps'(GPS 入客户园区统一合并到 queued)
      case 'driver_confirmed':
        return (
          <Space>
            <Tag color="cyan" icon={<CheckCircleOutlined />}>司机已确认到达</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              （系统自动链式 completed）
            </Text>
            <DevActions record={record} activeYardId={activeYard?.yardId} />
          </Space>
        )
      // ❌ v0.3.0-M2.2 删除:case 'customer_signed'(客户签收全链路已下线,completed 直接由 driver_confirmed 触发)
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
      {/* 订单主状态进度条 + 操作区(统一调车单流程栏,与 DispatchDetailPage/WarehouseDispatchDetailPage 一致) */}
      <DispatchFlowHeader dispatch={record} renderActions={renderActions} />

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
                <BoolTags isUrgent={record.isUrgent} isCarpool={record.isCarpool} />
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

      {/* 派车 Modal（统一走公共组件 <DispatchVehicleModal>） — confirmed 首次派车 / dispatched 重新派车 */}
      <DispatchVehicleModal
        open={dispatchModalOpen}
        dispatchNo={record.dispatchNo}
        vehicles={vehicles
          .filter((v) => v.status === 'enabled' && (!record.companyId || v.companyId === record.companyId))
          .map((v) => ({ id: v.id, plateNo: v.plateNo, maxLoad: v.maxLoad, length: v.length }))}
        drivers={drivers
          .filter((d) => d.status === 'enabled' && (!record.companyId || d.companyId === record.companyId))
          .map((d) => ({ id: d.id, name: d.name, phone: d.phone }))}
        // 「重新派车」时回填之前的车辆/司机/调车员；首次派车（confirmed）不传
        initialValues={
          record.status === 'dispatched' && record.vehicleId && record.driverId
            ? {
                vehicleId: record.vehicleId,
                driverId: record.driverId,
                dispatcherName: record.dispatcherName,
              }
            : undefined
        }
        onCancel={() => setDispatchModalOpen(false)}
        onOk={handleDispatch}
      />

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

      {/* ❌ v0.3.0-M2.2 删除:客户签收链接 Modal(全链路已下线) */}
    </PageContainer>
  )
}
