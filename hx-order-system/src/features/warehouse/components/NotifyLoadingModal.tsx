import { useState } from 'react'
import { Modal, Alert, Button, Descriptions, Space, message } from 'antd'
import { BellOutlined } from '@ant-design/icons'
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

/**
 * 通知司机装货 Modal（v0.2.0-M2.2 业务调整）
 *
 * 业务变更：
 *  - 库房员在 entering 状态（GPS 已入园）点【通知装货】
 *  - 司机收到推送「可以进场装货了」
 *  - 状态从 entering → loading
 *
 * 与旧 NotifyDepartModal 区别：
 *  - 旧版库房点「通知出发」（dispatched 状态）→ 通知司机出发 → 链式转 loading
 *  - 新版库房点「通知装货」（entering 状态）→ 通知司机进园装货 → 推 loading
 *  - 旧版的「通知出发」语义被物流公司的「派车」动作吸收
 */
export function NotifyLoadingModal({ open, dispatch, yardId, yardName, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const notifyLoading = useDispatchStore((s) => s.notifyLoading)

  const handleConfirm = async () => {
    if (!dispatch || !yardId) return
    setLoading(true)
    try {
      const notifiedAt = nowIsoString()
      await notifyLoading(dispatch.id, yardId, notifiedAt)
      message.success(`已通知司机装货（${dispatch.vehicleNo} → ${yardName || yardId}）`)
      onClose()
    } catch (e) {
      message.error('通知装货失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`通知司机装货 - ${dispatch?.dispatchNo || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="车辆 GPS 已入园。点击确认后通知司机进园装货，状态自动从 entering 推进至 loading。"
      />

      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="调车单号">{dispatch?.dispatchNo}</Descriptions.Item>
        <Descriptions.Item label="目标园区">
          <span style={{ color: '#1677ff', fontWeight: 500 }}>{yardName || yardId || '-'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="车牌号">{dispatch?.vehicleNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="司机">{dispatch?.driverName || '-'}</Descriptions.Item>
        <Descriptions.Item label="期望装货时间">{dispatch?.expectedLoadTime || '-'}</Descriptions.Item>
      </Descriptions>

      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size={8}>
        <Button
          type="primary"
          icon={<BellOutlined />}
          onClick={handleConfirm}
          loading={loading}
          block
          size="large"
        >
          确认通知装货
        </Button>
      </Space>
    </Modal>
  )
}