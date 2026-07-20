import { useState } from 'react'
import { Modal, Form, Input, Button, Descriptions, Alert, Space, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import type { Dispatch } from '@/types/dispatch'
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
  /** 超时原因（手填文本，2026-07-20 由多选改为单字符串） */
  reason?: string
  /** 超时责任部门（手填文本） */
  department?: string
  /** 负责人（手填文本） */
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
        reason: values.reason?.trim() || undefined,
        department: values.department?.trim() || undefined,
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
          name="reason"
          label="超时原因"
          tooltip="手填，如「路面不平」「下雨」"
        >
          <Input placeholder="例如：路面不平 / 下雨 / 叉车故障" maxLength={50} allowClear />
        </Form.Item>

        <Form.Item name="department" label="超时责任部门" tooltip="手填责任部门名称">
          <Input placeholder="例如：成品库一组 / 物流公司调度" maxLength={30} allowClear />
        </Form.Item>

        <Form.Item name="ownerName" label="负责人" tooltip="手填现场负责人姓名">
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