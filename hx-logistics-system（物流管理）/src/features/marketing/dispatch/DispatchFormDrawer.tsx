import { useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Divider,
  InputNumber,
  Card,
  Row,
  Col,
  message,
  Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useDispatchStore, useDictStore, useAuthStore, useInventoryStore } from '@/stores'
import { genId, genDispatchNo, DIRECTION_LABEL } from '@/utils'
import type { Dispatch, DispatchGoods } from '@/types/dispatch'
import { ORDER_TYPE_LABEL } from '@/types/inventory'

interface Props {
  open: boolean
  dispatch?: Dispatch | null
  /** 从库存关联跳转时传入，自动锁定该库存并预填货物信息 */
  linkedInventoryId?: string | null
  onClose: () => void
}

/** 调车单新建/编辑表单（支持拼车+多园区） */
export function DispatchFormDrawer({ open, dispatch, linkedInventoryId, onClose }: Props) {
  const [form] = Form.useForm()
  const [goodsForm] = Form.useForm()
  const save = useDispatchStore((s) => s.save)
  const companies = useDictStore((s) => s.companies)
  const yards: { id: string; name: string }[] = []
  const currentUser = useAuthStore((s) => s.currentUser)
  const { getById, lock } = useInventoryStore()

  useEffect(() => {
    if (open) {
      if (dispatch) {
        form.setFieldsValue({
          ...dispatch,
          expectedLoadTime: dispatch.expectedLoadTime ? dayjs(dispatch.expectedLoadTime) : null,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          dispatchNo: genDispatchNo(),
          status: 'pending_confirm',
        })
        // 从库存关联进入：自动锁定库存
        if (linkedInventoryId) {
          const inv = getById(linkedInventoryId)
          if (inv) {
            lock(linkedInventoryId)
            // 预填货物信息（仅参考，可改）
            const existing = useDispatchStore.getState().list.find((d) => d.id === 'temp')
            form.setFieldValue('_pendingGoods', [
              ...(form.getFieldValue('_pendingGoods') || []),
              {
                id: genId('goods'),
                dispatchId: 'temp',
                goodsName: inv.materialName,
                quantity: inv.quantity,
                unit: '箱',
                weight: inv.weightPerBox,
                customerName: inv.customerName,
                destination: inv.customerAddress,
                remark: `从库存 ${inv.id} 关联，订单类型：${ORDER_TYPE_LABEL[inv.orderType]}`,
              },
            ])
            message.success(`已自动锁定库存 ${inv.id}`)
          }
        }
      }
    }
  }, [open, dispatch, linkedInventoryId, form, getById, lock])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const id = dispatch?.id || genId('dispatch')
      const existing = useDispatchStore.getState().list.find((d) => d.id === id)
      const newDispatch: Dispatch = {
        id,
        dispatchNo: values.dispatchNo,
        status: values.status || 'pending_confirm',
        direction: values.direction,
        expectedLoadTime: values.expectedLoadTime?.format('YYYY-MM-DD HH:mm:ss') || '',
        remark: values.remark,
        creatorId: dispatch?.creatorId || currentUser?.id || '',
        creatorName: dispatch?.creatorName || currentUser?.realName || '',
        companyId: values.companyId,
        companyName: companies.find((c) => c.id === values.companyId)?.name || '',
        yardId: values.yardId,
        yardName: yards.find((y) => y.id === values.yardId)?.name || '',
        goods: existing?.goods || [],
        createdAt: existing?.createdAt || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ...(existing || {}),
      } as Dispatch
      // 重新设置，因为 spread 会覆盖
      newDispatch.goods = existing?.goods || []
      await save(newDispatch)
      message.success(dispatch ? '编辑成功' : '创建成功')
      onClose()
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return
      message.error('操作失败')
    }
  }

  const handleAddGoods = async () => {
    try {
      const values = await goodsForm.validateFields()
      const dispatchId = dispatch?.id || 'temp'
      const newGoods: DispatchGoods = {
        id: genId('goods'),
        dispatchId,
        goodsName: values.goodsName,
        quantity: values.quantity,
        unit: values.unit || '件',
        weight: values.weight,
        customerName: values.customerName,
        destination: values.destination,
        remark: values.remark,
      }
      const current = useDispatchStore.getState().list.find((d) => d.id === dispatchId)
      if (current) {
        await save({ ...current, goods: [...current.goods, newGoods] })
      } else {
        // 暂存到 form（保存主体后再合并）
        form.setFieldValue('_pendingGoods', [
          ...(form.getFieldValue('_pendingGoods') || []),
          newGoods,
        ])
      }
      goodsForm.resetFields()
      message.success('货物已添加')
    } catch {
      // 校验失败
    }
  }

  const handleRemoveGoods = async (gid: string) => {
    const dispatchId = dispatch?.id || 'temp'
    const current = useDispatchStore.getState().list.find((d) => d.id === dispatchId)
    if (current) {
      await save({ ...current, goods: current.goods.filter((g) => g.id !== gid) })
    } else {
      const pending = (form.getFieldValue('_pendingGoods') || []).filter(
        (g: DispatchGoods) => g.id !== gid,
      )
      form.setFieldValue('_pendingGoods', pending)
    }
  }

  const currentGoods =
    useDispatchStore.getState().list.find((d) => d.id === dispatch?.id)?.goods ||
    form.getFieldValue('_pendingGoods') ||
    []

  // 关联库存的提示信息
  const linkedInventory = linkedInventoryId ? getById(linkedInventoryId) : null

  return (
    <Drawer
      title={dispatch ? `编辑调车单 - ${dispatch.dispatchNo}` : '新建调车单'}
      open={open}
      onClose={onClose}
      width={720}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            保存
          </Button>
        </Space>
      }
    >
      {linkedInventory && (
        <Alert
          icon={<LinkOutlined />}
          message={`已从库存 ${linkedInventory.id} 关联`}
          description={`货物信息已预填，该库存已自动锁定为「已锁定」状态。请补充物流公司、园区、装货时间等信息后保存。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dispatchNo" label="调车编号" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'pending_confirm', label: '待确认' },
                  { value: 'confirmed', label: '已确认' },
                  { value: 'cancelled', label: '已取消' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="companyId" label="物流公司" rules={[{ required: true }]}>
              <Select
                placeholder="请选择"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="yardId" label="园区" rules={[{ required: true }]}>
              <Select
                placeholder="请选择"
                options={yards.map((y) => ({ value: y.id, label: y.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="direction" label="方向" rules={[{ required: true }]}>
              <Select
                placeholder="请选择"
                options={Object.entries(DIRECTION_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="expectedLoadTime" label="期望装货时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
      </Form>

      <Divider orientation="left">货物清单（支持拼车：多货物同方向）</Divider>

      <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
        <Form form={goodsForm} layout="inline" onFinish={handleAddGoods}>
          <Form.Item name="goodsName" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="货物名称" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="quantity" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber placeholder="数量" min={1} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="unit" initialValue="件">
            <Input placeholder="单位" style={{ width: 80 }} />
          </Form.Item>
          <Form.Item name="weight">
            <InputNumber placeholder="重量(kg)" min={0} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="customerName">
            <Input placeholder="客户" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="destination">
            <Input placeholder="目的地" style={{ width: 140 }} />
          </Form.Item>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddGoods}>
            添加
          </Button>
        </Form>
      </Card>

      {currentGoods.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          暂无货物，请在上方添加
        </div>
      ) : (
        currentGoods.map((g: DispatchGoods) => (
          <Card
            key={g.id}
            size="small"
            style={{ marginBottom: 8 }}
            extra={
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveGoods(g.id)}
              >
                移除
              </Button>
            }
          >
            <Row gutter={8}>
              <Col span={6}>
                <b>{g.goodsName}</b> × {g.quantity}
                {g.unit}
              </Col>
              <Col span={6}>重量：{g.weight || '-'} kg</Col>
              <Col span={6}>客户：{g.customerName || '-'}</Col>
              <Col span={6}>目的地：{g.destination || '-'}</Col>
            </Row>
          </Card>
        ))
      )}
    </Drawer>
  )
}
