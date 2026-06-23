import { useEffect, useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Drawer,
  Button,
  Space,
  message,
  Row,
  Col,
  AutoComplete,
} from 'antd'
import { useInventoryStore } from '@/stores'
import {
  ORDER_TYPE_OPTIONS,
  PACKAGING_OPTIONS,
} from '@/types/inventory'
import type { Inventory } from '@/types/inventory'
import type { Customer } from '@/types/customer'
import styles from './InventoryFormDrawer.module.css'

interface Props {
  open: boolean
  inventory: Inventory | null
  customers: Customer[]
  onClose: () => void
}

export function InventoryFormDrawer({ open, inventory, customers, onClose }: Props) {
  const [form] = Form.useForm()
  const { create, update } = useInventoryStore()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const isEdit = !!inventory
  const isView = !!(inventory && inventory.status !== 'in_stock')

  useEffect(() => {
    if (open) {
      if (inventory) {
        form.setFieldsValue(inventory)
        const c = customers.find((c) => c.id === inventory.customerId)
        setSelectedCustomer(c || null)
      } else {
        form.resetFields()
        setSelectedCustomer(null)
      }
    }
  }, [open, inventory, customers, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (isEdit && inventory) {
        update(inventory.id, values)
        message.success('更新成功')
      } else {
        create({
          ...values,
          customerId: selectedCustomer?.id || '',
          customerName: selectedCustomer?.name || values.customerName,
          customerAddress: selectedCustomer?.address || '',
          status: 'in_stock',
        })
        message.success('创建成功')
      }
      onClose()
    } catch {
      // 校验失败由 antd 处理
    }
  }

  const customerOptions = customers
    .filter((c) => c.status === 'active')
    .map((c) => ({ value: c.name, label: c.name, id: c.id, address: c.address }))

  return (
    <Drawer
      title={isView ? '查看库存' : isEdit ? '编辑库存' : '新增库存'}
      open={open}
      onClose={onClose}
      width={640}
      extra={
        isView ? (
          <Button onClick={onClose}>关闭</Button>
        ) : (
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>保存</Button>
          </Space>
        )
      }
    >
      <Form form={form} layout="vertical" className={styles.form} disabled={isView} requiredMark={false}>
        {/* 基础信息 */}
        <div className={styles.formGroup}>
          <div className={styles.groupTitle}>基础信息</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="barcode" label="条码编号" rules={[{ required: true, message: '请输入条码编号' }, { max: 50 }]}>
                <Input placeholder="请输入条码编号" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productionNo" label="生产编号">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderType" label="订单类型" rules={[{ required: true }]}>
                <Select options={ORDER_TYPE_OPTIONS} placeholder="请选择订单类型" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 物料信息 */}
        <div className={styles.formGroup}>
          <div className={styles.groupTitle}>物料信息</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="materialCode" label="物料编码" rules={[{ required: true, message: '请输入物料编码' }, { max: 30 }]}>
                <Input placeholder="请输入物料编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="materialName" label="物料名称" rules={[{ required: true, message: '请输入物料名称' }, { max: 100 }]}>
                <Input placeholder="请输入物料名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="materialDrawingNo" label="物料图号">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 客户信息 */}
        <div className={styles.formGroup}>
          <div className={styles.groupTitle}>客户信息</div>
          <Form.Item
            name="customerName"
            label="客户名称"
            rules={[{ required: true, message: '请选择客户' }]}
            extra={selectedCustomer ? `地址：${selectedCustomer.address}` : '请从已有客户档案中选择'}
          >
            <AutoComplete
              options={customerOptions}
              placeholder="输入关键字搜索客户"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onSelect={(_, option: { id?: string }) => {
                const c = customers.find((c) => c.id === option.id)
                setSelectedCustomer(c || null)
              }}
              onChange={(value) => {
                const c = customers.find((c) => c.name === value)
                setSelectedCustomer(c || null)
              }}
            />
          </Form.Item>
        </div>

        {/* 重量与数量 */}
        <div className={styles.formGroup}>
          <div className={styles.groupTitle}>重量与数量</div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="netWeightPerPiece" label="单件净重(kg)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weightPerBox" label="单箱货重(kg)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="quantity" label="数量(箱)" rules={[{ required: true, message: '请输入数量' }, { type: 'number', min: 1 }]}>
                <InputNumber min={1} step={1} precision={0} style={{ width: '100%' }} placeholder="箱数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="packaging" label="包装类型">
                <Select options={PACKAGING_OPTIONS} placeholder="选填" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="age" label="库龄(天)" rules={[{ type: 'number', min: 0, max: 9999 }]}>
                <InputNumber min={0} max={9999} style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 备注 */}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="选填" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
