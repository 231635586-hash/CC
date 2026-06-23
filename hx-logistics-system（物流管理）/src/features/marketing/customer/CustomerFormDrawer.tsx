import { useEffect } from 'react'
import { Form, Input, Select, Drawer, Button, Space, message } from 'antd'
import { useCustomerStore } from '@/stores'
import { CUSTOMER_STATUS_OPTIONS } from '@/types/customer'
import type { Customer } from '@/types/customer'
import styles from './CustomerFormDrawer.module.css'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

export function CustomerFormDrawer({ open, customer, onClose }: Props) {
  const [form] = Form.useForm()
  const { create, update } = useCustomerStore()
  const isEdit = !!customer

  useEffect(() => {
    if (open) {
      if (customer) {
        form.setFieldsValue(customer)
      } else {
        form.resetFields()
        form.setFieldsValue({ status: 'active' })
      }
    }
  }, [open, customer, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (isEdit && customer) {
        update(customer.id, values)
        message.success('更新成功')
      } else {
        create(values)
        message.success('创建成功')
      }
      onClose()
    } catch {
      // 校验失败由 antd 处理
    }
  }

  return (
    <Drawer
      title={isEdit ? '编辑客户' : '新增客户'}
      open={open}
      onClose={onClose}
      width={520}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" className={styles.form} requiredMark={false}>
        {isEdit && (
          <Form.Item label="客户编码">
            <Input value={customer?.id} disabled />
          </Form.Item>
        )}
        <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
          <Input placeholder="请输入客户名称" />
        </Form.Item>
        <Form.Item name="address" label="客户地址" rules={[{ required: true, message: '请输入客户地址' }]}>
          <Input.TextArea rows={2} placeholder="请输入客户地址" />
        </Form.Item>
        <Form.Item name="contact" label="联系人">
          <Input placeholder="选填" />
        </Form.Item>
        <Form.Item name="phone" label="联系电话">
          <Input placeholder="选填" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={CUSTOMER_STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="选填" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
