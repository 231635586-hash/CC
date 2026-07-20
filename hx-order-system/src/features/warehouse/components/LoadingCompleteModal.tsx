import { useState } from 'react'
import { Modal, Form, Select, Input, Button, Descriptions, Alert, Space, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import type { Dispatch } from '@/types/dispatch'
import { OVERTIME_REASON_OPTIONS, OVERTIME_DEPARTMENT_OPTIONS } from '@/types/dispatch'
import { useDispatchStore } from '@/stores/dispatch'
import { nowIsoString } from '@/utils'

interface Props {
  open: boolean
  dispatch: Dispatch | null
  yardId: string | null
  yardName?: string
  onClose: () => void
}

interface OvertimeValues {
  reasons?: string[]
  department?: string
  ownerName?: string
}

/**
 * 装货完成 Modal（2026-07-20 新增）
 *
 * 业务：
 *  - 库房员在 loading 状态点【装货完成】→ 弹此 Modal
 *  - 3 字段（超时原因 / 责任部门 / 负责人）全选填
 *  - onOk → 写 loadingCompletedAt + overtime* 字段 + 状态自动推 loading → leaving
 *
 * 设计：
 *  - 仿 DispatchVehicleModal 风格（Form + Form.Item + rules）
 *  - 全选填，不强制校验必填
 *  - 留空时仍可提交（用于非超时场景的纯记录）
 */
export function LoadingCompleteModal({ open, dispatch, yardId, yardName, onClose }: Props) {
  const [form] = Form.useForm<OvertimeValues>()
  const [loading, setLoading] = useState(false)
  const markLoadingCompleted = useDispatchStore((s) => s.markLoadingCompleted)

  // 弹窗打开时重置表单（destroyOnClose 也保证）
  // 关闭后下次打开是空表单（不残留上次填写）
  const handleAfterClose = () => {
    form.resetFields()
  }

  const handleConfirm = async () => {
    if (!dispatch || !yardId) return
    setLoading(true)
    try {
      // 取表单值（不做 validateFields 强制必填，全选填）
      const values = await form.validateFields().catch(() => form.getFieldsValue())
      const completedAt = nowIsoString()
      const overtime = {
        reasons: values.reasons?.length ? values.reasons : undefined,
        department: values.department || undefined,
        ownerName: values.ownerName?.trim() || undefined,
      }
      await markLoadingCompleted(dispatch.id, yardId, completedAt, overtime)
      message.success(`已标记 ${yardName || yardId} 装货完成`)
      onClose()
    } catch (e) {
      message.error('装货完成失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`装货完成 - ${dispatch?.dispatchNo || ''}`}
      open={open}
      onCancel={onClose}
      afterClose={handleAfterClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="库房员确认装货完成。下方 3 项超时备注全选填，未超时可直接确认跳过。"
      />

      <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="调车单号">{dispatch?.dispatchNo}</Descriptions.Item>
        <Descriptions.Item label="目标园区">
          <span style={{ color: '#1677ff', fontWeight: 500 }}>{yardName || yardId || '-'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="车牌号">{dispatch?.vehicleNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="司机">{dispatch?.driverName || '-'}</Descriptions.Item>
        <Descriptions.Item label="期望装货时间">{dispatch?.expectedLoadTime || '-'}</Descriptions.Item>
      </Descriptions>

      <Form<OvertimeValues> form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reasons"
          label="超时原因（多选）"
          tooltip="可勾选 1 个或多个；与装货慢、园区拥堵等场景对应"
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="请选择超时原因（可多选）"
            options={OVERTIME_REASON_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="department" label="超时责任部门（单选）" tooltip="全选填；判定后责任归属">
          <Select
            allowClear
            placeholder="请选择责任部门"
            options={OVERTIME_DEPARTMENT_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="ownerName" label="负责人（手填）" tooltip="全选填；填写现场负责人姓名">
          <Input placeholder="如：张三 / 李四" maxLength={20} allowClear />
        </Form.Item>
      </Form>

      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size={8}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleConfirm}
          loading={loading}
          block
          size="large"
        >
          确认装货完成
        </Button>
      </Space>
    </Modal>
  )
}