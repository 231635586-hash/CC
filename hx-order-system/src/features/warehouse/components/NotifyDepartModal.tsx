import { useState } from 'react'
import { Modal, Alert, Button, Descriptions, Space, message } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import type { Dispatch } from '@/types/dispatch'
import { useDispatchStore } from '@/stores/dispatch'
import { pushDepartNotify } from '@/services/dingtalk'
import { nowIsoString } from '@/utils'

interface Props {
  open: boolean
  dispatch: Dispatch | null
  yardId: string | null
  yardName?: string
  onClose: () => void
}

/**
 * 通知司机出发 Modal（M3 阶段）
 *
 * 业务变更（vs M2 通知入场 Modal）：
 *  - 派车后库房点【通知出发】→ 推送 H5 司机"可以出发了"
 *  - 不再生成 enterToken / 二维码（H5 扫码入场流程废除）
 *  - 入场完全由车辆 GPS 进入园区半径自动触发
 */
export function NotifyDepartModal({ open, dispatch, yardId, yardName, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const notifyDepart = useDispatchStore((s) => s.notifyDepart)

  const handleConfirm = async () => {
    if (!dispatch || !yardId) return
    setLoading(true)
    try {
      const departAt = nowIsoString()
      // 1) 写入 dispatch.yardTimelines[].notifyDepartAt
      await notifyDepart(dispatch.id, yardId, departAt)
      // 2) 钉钉 / H5 推送（mock 阶段写 pushLogs）
      await pushDepartNotify({ dispatch, yardId })
      message.success(`已通知司机出发（${dispatch.vehicleNo} → ${yardName || yardId}）`)
      onClose()
    } catch (e) {
      message.error('通知出发失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`通知司机出发 - ${dispatch?.dispatchNo || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="派车后通知司机出发。司机到达园区门口后，由车辆硬件 GPS 自动判定入园并触发后续流程。"
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
          确认通知出发
        </Button>
      </Space>
    </Modal>
  )
}
