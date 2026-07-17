import { useEffect, useMemo, useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Button,
  message,
  Row,
  Col,
  AutoComplete,
  DatePicker,
} from 'antd'
import dayjs from 'dayjs'
import { useInventoryStore, useDictStore } from '@/stores'
import { useCurrentOperator, resolveOperator } from '@/hooks/useOperator'
import { FormSection, RequiredHint } from '@/components'
import {
  MATERIAL_CATEGORY_OPTIONS,
  STOCK_TYPE_OPTIONS,
  PACKAGING_OPTIONS,
} from '@/types/inventory'
import type { Inventory, StockType } from '@/types/inventory'
import type { Customer } from '@/types/customer'
import styles from './InventoryFormDrawer.module.css'

interface Props {
  open: boolean
  inventory: Inventory | null
  customers: Customer[]
  onClose: () => void
}

/** 库存新建/编辑表单（对齐"添加待调货明细"4 列网格） */
export function InventoryFormDrawer({ open, inventory, customers, onClose }: Props) {
  const [form] = Form.useForm()
  const { create, update } = useInventoryStore()
  const { yards, loadYards } = useDictStore()
  const currentOperator = useCurrentOperator()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const isEdit = !!inventory
  const isView = !!(inventory && inventory.status !== 'in_stock')

  useEffect(() => {
    loadYards()
  }, [loadYards])

  useEffect(() => {
    if (open) {
      if (inventory) {
        form.setFieldsValue(inventory)
        const c = customers.find((c) => c.id === inventory.customerId)
        setSelectedCustomer(c || null)
      } else {
        form.resetFields()
        // 新增时自动带入当前登录用户为业务员（系统自动记录录入人，不可改）
        form.setFieldsValue({
          salesPersonId: currentOperator.id,
          salesPersonName: currentOperator.name,
        })
        setSelectedCustomer(null)
      }
    }
  }, [open, inventory, customers, form, currentOperator])

  // 监听单箱数量 / 箱数 → 自动算 总数（展示，不参与提交）
  const quantityPerBox = Form.useWatch('quantityPerBox', form) as number | undefined
  const boxCount = Form.useWatch('quantity', form) as number | undefined
  const totalQuantityAuto = useMemo(() => {
    if (
      typeof quantityPerBox === 'number' &&
      typeof boxCount === 'number' &&
      quantityPerBox >= 0 &&
      boxCount >= 0
    ) {
      return quantityPerBox * boxCount
    }
    return undefined
  }, [quantityPerBox, boxCount])

  // 监听现货/等货 → 联动预计到货时间（仅 waiting 时必填且可填；现货时 disabled；提交时清理）
  const stockTypeWatch = Form.useWatch('stockType', form) as StockType | undefined

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 总数自动计算覆盖
      const totalQuantity =
        (typeof values.quantityPerBox === 'number' && typeof values.quantity === 'number')
          ? values.quantityPerBox * values.quantity
          : values.totalQuantity

      // 现货状态清理 expectedArrivalAt（避免 stale 数据进入 payload）
      if (values.stockType !== 'waiting') {
        delete values.expectedArrivalAt
      }

      const yard = yards.find((y) => y.id === values.yardId)
      const payload = {
        ...values,
        totalQuantity,
        yardName: yard?.name,
        customerId: selectedCustomer?.id || values.customerId || '',
        customerName: selectedCustomer?.name || values.customerName,
        customerAddress: selectedCustomer?.address || values.customerAddress || '',
        status: inventory?.status || 'in_stock',
      }
      // 业务员：编辑已有记录时保留原值，新建时由 useEffect 注入 currentUser
      const { id: salesPersonId, name: salesPersonName } = resolveOperator(
        inventory ? { id: inventory.salesPersonId, name: inventory.salesPersonName } : null,
        { id: values.salesPersonId, name: values.salesPersonName },
        currentOperator,
      )
      const finalPayload = {
        ...payload,
        salesPersonId,
        salesPersonName,
      }
      if (isEdit && inventory) {
        update(inventory.id, finalPayload)
        message.success('更新成功')
      } else {
        create(finalPayload)
        message.success('创建成功')
      }
      onClose()
    } catch {
      // 校验失败由 antd 处理
    }
  }

  const customerOptions = customers
    .filter((c) => c.status === 'active')
    .map((c) => ({ value: c.name, label: c.name, id: c.id, address: c.address, code: c.code }))

  // 可用园区（仅启用）
  const yardOptions = useMemo(
    () =>
      yards
        .filter((y) => y.status === 'enabled')
        .map((y) => ({ value: y.id, label: y.name })),
    [yards],
  )

  return (
    <Modal
      title={isView ? '查看库存' : isEdit ? '编辑库存' : '添加待调货明细'}
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      destroyOnClose
      footer={
        isView ? (
          [
            <Button key="close" onClick={onClose}>关闭</Button>,
          ]
        ) : (
          [
            <Button key="cancel" onClick={onClose}>取消</Button>,
            <Button key="submit" type="primary" onClick={handleSubmit}>确定</Button>,
          ]
        )
      }
    >
      <Form form={form} layout="vertical" className={styles.form} disabled={isView}>
        <RequiredHint />
        {/* 基础信息（4 列） */}
        <FormSection title="基础信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="yardId"
                label="归属"
                rules={[{ required: true, message: '请选择归属园区' }]}
              >
                <Select options={yardOptions} placeholder="如：甘亭" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="customerCode" label="客户编号">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <AutoComplete
                  options={customerOptions}
                  placeholder="输入客户名称"
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
            </Col>
            <Col span={6}>
              <Form.Item
                name="shippingFrom"
                label="发货地"
                rules={[{ required: true, message: '请输入发货地' }]}
              >
                <Input placeholder="如：苏州" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 物料信息（4 列） */}
        <FormSection title="物料信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="category"
                label="类别"
                rules={[{ required: true, message: '请选择类别' }]}
              >
                <Select options={MATERIAL_CATEGORY_OPTIONS} placeholder="毛坯 / 加工件" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="materialCode"
                label="物料编码"
                rules={[{ required: true, message: '请输入物料编码' }, { max: 30 }]}
              >
                <Input placeholder="请输入物料编码" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="productName"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }, { max: 100 }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="drawingNo"
                label="图号"
                rules={[{ required: true, message: '请输入图号' }, { max: 50 }]}
              >
                <Input placeholder="请输入图号" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 数量与重量（4 列） */}
        <FormSection title="数量与重量">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="quantityPerBox"
                label="单箱数量"
                rules={[{ required: true, message: '请输入单箱数量' }, { type: 'number', min: 1 }]}
              >
                <InputNumber min={1} step={1} precision={0} style={{ width: '100%' }} placeholder="件/箱" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="箱数"
                rules={[{ required: true, message: '请输入箱数' }, { type: 'number', min: 1 }]}
              >
                <InputNumber min={1} step={1} precision={0} style={{ width: '100%' }} placeholder="总箱数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="totalQuantity" label="总数（自动计算）">
                <InputNumber
                  style={{ width: '100%' }}
                  value={totalQuantityAuto}
                  disabled
                  placeholder="单箱数量 × 箱数"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unitWeight"
                label="单重(kg)"
                rules={[{ required: true, message: '请输入单重' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="单件 kg" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="boxWeight"
                label="箱重(kg)"
                rules={[{ required: true, message: '请输入箱重' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="单箱 kg" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="netWeight"
                label="净重(kg)"
                rules={[{ required: true, message: '请输入净重' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="手动输入" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="partitionWeightPerBox"
                label="单箱隔板重(kg)"
                rules={[{ required: true, message: '请输入单箱隔板重' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="kg/箱" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="partitionTotalWeight"
                label="隔板总重(kg)"
                rules={[{ required: true, message: '请输入隔板总重' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="手动输入" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 业务信息（4 列） */}
        <FormSection title="业务信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="tonnagePerVehicle"
                label="吨位/车"
                rules={[{ required: true, message: '请输入吨位' }, { type: 'number', min: 0 }]}
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="吨" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="stockType"
                label="现货/等货"
                rules={[{ required: true, message: '请选择现货/等货' }]}
                initialValue={'in_stock_now' as StockType}
              >
                <Select options={STOCK_TYPE_OPTIONS} placeholder="现货 / 等货" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="expectedArrivalAt"
                label="预计到货时间"
                rules={
                  stockTypeWatch === 'waiting'
                    ? [{ required: true, message: '请选择预计到货时间' }]
                    : []
                }
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder={stockTypeWatch === 'waiting' ? '选择日期' : '现货无需填写'}
                  disabledDate={(current) => !!current && current < dayjs().startOf('day')}
                  format="YYYY-MM-DD"
                  disabled={stockTypeWatch !== 'waiting'}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="customerMaterialCode" label="客户物料编码">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="packaging" label="包装类型">
                <Select options={PACKAGING_OPTIONS} placeholder="选填" allowClear />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 其他信息（4 列） */}
        <FormSection title="其他信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="barcode" label="条码编号" rules={[{ required: true, message: '请输入条码编号' }, { max: 50 }]}>
                <Input placeholder="请输入条码编号" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="productionNo" label="生产编号">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="age" label="库龄(天)" rules={[{ type: 'number', min: 0, max: 9999 }]}>
                <InputNumber min={0} max={9999} style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="remark" label="备注">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              {/* 业务员只读展示：新增时由系统自动带入当前登录用户，编辑时保留原录入人 */}
              <Form.Item name="salesPersonName" label="业务员">
                <Input
                  placeholder={currentOperator.name || '当前登录用户'}
                  disabled
                  prefix={<span style={{ color: '#999' }}>系统</span>}
                />
              </Form.Item>
            </Col>
          </Row>
          {/* salesPersonId 字段（hidden），仅随表单提交，不展示 */}
          <Form.Item name="salesPersonId" hidden>
            <Input />
          </Form.Item>
        </FormSection>
      </Form>
    </Modal>
  )
}