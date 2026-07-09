import { useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Modal,
  Button,
  Row,
  Col,
  message,
} from 'antd'
import { useCustomerStore } from '@/stores'
import { CUSTOMER_STATUS_OPTIONS } from '@/types/customer'
import type { Customer } from '@/types/customer'
import { FormSection, RequiredHint } from '@/components'
import { useCurrentOperator, resolveOperator } from '@/hooks/useOperator'
import styles from './CustomerFormDrawer.module.css'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

/** 客户档案新增/编辑（对齐库存管理：居中 Modal + 必填红星 + 添加人只读） */
export function CustomerFormDrawer({ open, customer, onClose }: Props) {
  const [form] = Form.useForm()
  const { create, update } = useCustomerStore()
  const currentOperator = useCurrentOperator()
  const isEdit = !!customer

  useEffect(() => {
    if (open) {
      if (customer) {
        form.setFieldsValue(customer)
      } else {
        form.resetFields()
        // 新增时自动带入当前登录用户为添加人（系统自动记录，不可改）
        form.setFieldsValue({
          status: 'active',
          creatorId: currentOperator.id,
          creatorName: currentOperator.name,
        })
      }
    }
  }, [open, customer, form, currentOperator])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 编辑已有客户时保留原添加人（不变更录入人）
      const { id: creatorId, name: creatorName } = resolveOperator(
        customer ? { id: customer.creatorId, name: customer.creatorName } : null,
        { id: values.creatorId, name: values.creatorName },
        currentOperator,
      )
      const payload = { ...values, creatorId, creatorName }
      if (isEdit && customer) {
        update(customer.id, payload)
        message.success('更新成功')
      } else {
        create(payload)
        message.success('创建成功')
      }
      onClose()
    } catch {
      // 校验失败由 antd 处理
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑客户' : '新增客户'}
      open={open}
      onCancel={onClose}
      width={720}
      centered
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>确定</Button>,
      ]}
    >
      <Form form={form} layout="vertical" className={styles.form}>
        <RequiredHint />

        {/* 基础信息（4 列） */}
        <FormSection title="基础信息">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }, { max: 100 }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select options={CUSTOMER_STATUS_OPTIONS} placeholder="启用 / 停用" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="address"
                label="客户地址"
                rules={[{ required: true, message: '请输入客户地址' }, { max: 200 }]}
              >
                <Input.TextArea rows={2} placeholder="请输入客户地址" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 联系信息（4 列） */}
        <FormSection title="联系信息">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact" label="联系人" rules={[{ max: 50 }]}>
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ max: 20 }, { pattern: /^[\d\-+\s()]*$/, message: '电话号码格式不正确' }]}
              >
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* 其他信息（4 列） */}
        <FormSection title="其他信息">
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item name="remark" label="备注" rules={[{ max: 200 }]}>
                <Input.TextArea rows={2} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              {/* 添加人只读展示：新增时由系统自动带入当前登录用户，编辑时保留原录入人 */}
              <Form.Item name="creatorName" label="添加人">
                <Input
                  placeholder={currentOperator.name || '当前登录用户'}
                  disabled
                  prefix={<span style={{ color: '#999' }}>系统</span>}
                />
              </Form.Item>
            </Col>
          </Row>
          {/* creatorId 字段（hidden），仅随表单提交，不展示 */}
          <Form.Item name="creatorId" hidden>
            <Input />
          </Form.Item>
        </FormSection>
      </Form>
    </Modal>
  )
}
