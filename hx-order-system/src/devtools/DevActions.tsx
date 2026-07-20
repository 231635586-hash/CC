/**
 * Mock 演示按钮集合
 *
 * 业务背景：v0.2.0-M2 mock 阶段，GPS 入园等真实链路未接入，
 * 库房员/调度员需要在 PC 端手动"模拟"这些动作以演示完整状态机。
 *
 * v1.0 调整：去除 `import.meta.env.DEV` gate
 *  - 原因：vercel demo 部署给客户演示时也需要看到这些按钮走通完整流程
 *  - 安全：所有按钮带「演示：」前缀 + Tooltip 明示"不会真的通知司机/客户"
 *  - 后续：真实 GPS 链路接通后整个模块删除
 *
 * 何时删除：
 *  - markYardQueuedByGps 由真实 GPS 流自动触发（v0.3.0-M2.2 改为 queued）
 *  - markLeftYard / markArrivedByGps 由真实 GPS 流自动触发
 *  - 客户签收（M2 v0.2.0）已下线，无对应按钮
 */

import { Button, Space, message } from 'antd'
import {
  CarOutlined, EnvironmentOutlined, ToolOutlined,
} from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useDispatchStore } from '@/stores/dispatch'
import { nowIsoString } from '@/utils'
import { pushTransitNotify, pushArrivedNotify } from '@/services/dingtalk'
import type { Dispatch } from '@/types/dispatch'

interface Props {
  record: Dispatch
  /** 当前进行中的园区（用于 yardId 入参） */
  activeYardId?: string
}

/**
 * 演示按钮组（仅 mock 阶段显示）
 *
 * 真实链路接通后此组件整体下线：
 *  - GPS 检测入园 → markYardQueuedByGps 由真实 GPS 流触发（M2.2 v2）
 *  - 车辆出厂 → markLeftYard 由真实 GPS 离厂信号触发
 *  - GPS 入客户园区 → markArrivedByGps 由真实 GPS 流触发（仅记录 arrivedByGpsAt 字段）
 */
export function DevActions({ record, activeYardId }: Props) {
  // v1.0 调整：取消 DEV gate，让 vercel demo 部署也能演示完整流程
  // 按钮文案以「演示：」为前缀 + Tooltip 明示 mock 性质，避免库房员误操作
  // const _ = import.meta.env.DEV // 保留可读性注释:DEV 检查已移除

  const { markYardQueuedByGps, markLeftYard, markArrivedByGps } = useDispatchStore.getState()

  const onSimulateGpsEnter = async () => {
    if (!activeYardId || !record.vehicleId) {
      message.warning('未派车，无法模拟 GPS 检测')
      return
    }
    const ts = nowIsoString()
    // M2.2 v2:GPS 检测现在统一触发 queued（不再直接 entering,需库房员点通知入场）
    await markYardQueuedByGps(record.vehicleId, activeYardId, ts)
    message.success('演示：GPS 检测（已进入 queued,需通知入场）')
  }

  const onMarkLeftYard = async () => {
    const ts = nowIsoString()
    await markLeftYard(record.id, ts)
    await pushTransitNotify({ dispatch: record })
    message.success('演示：车辆出厂（已进入在途）')
  }

  const onMarkArrivedByGps = async () => {
    if (!record.vehicleId) {
      message.warning('未派车，无法模拟 GPS')
      return
    }
    const ts = nowIsoString()
    await markArrivedByGps(record.vehicleId, ts)
    await pushArrivedNotify({ dispatch: record, arrivedAt: ts })
    message.success('演示：GPS 入客户园区（请到 H5 确认）')
  }

  // ❌ v0.3.0-M2.2 删除:onSimulateSign / 演示：客户签收 按钮（客户签收全链路已下线）

  return (
    <Tooltip
      title="仅 mock 演示按钮，不会真实通知司机/客户；真实链路接通后此区域会下线"
      placement="left"
    >
      <Space size={4} wrap>
        <Button size="small" variant="dashed" icon={<EnvironmentOutlined />} onClick={onSimulateGpsEnter}>
          演示：GPS 入库
        </Button>
        <Button size="small" variant="dashed" icon={<CarOutlined />} onClick={onMarkLeftYard}>
          演示：车辆出厂
        </Button>
        <Button size="small" variant="dashed" icon={<EnvironmentOutlined />} onClick={onMarkArrivedByGps}>
          演示：GPS 入客户园区
        </Button>
        <Button size="small" type="text" icon={<ToolOutlined />} disabled>
          devtools
        </Button>
      </Space>
    </Tooltip>
  )
}