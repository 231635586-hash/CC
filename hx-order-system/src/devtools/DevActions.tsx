/**
 * Mock 演示按钮集合（DEV-ONLY）
 *
 * 业务背景：v0.2.0-M2 mock 阶段，GPS 入园、客户签收等真实链路未接入，
 * 库房员/调度员需要在 PC 端手动"模拟"这些动作以演示完整状态机。
 *
 * 隔离原则：
 *  - 整个模块由 `import.meta.env.DEV` 控制，prod 构建被 Vite 物理 tree-shake
 *  - 所有按钮带「演示：」前缀 + Tooltip 明示"不会真的通知司机/客户"
 *  - 真实链路接通后（GPS 流对接 / 客户 H5 推送），本模块直接删除
 *
 * 何时删除：
 *  - markYardEnteredByGps 由真实 GPS 流自动触发
 *  - markLeftYard / markArrivedByGps 由真实 GPS 流自动触发
 *  - signByCustomer 由客户签收 H5 提交触发
 */

import { Button, Space, message } from 'antd'
import {
  CarOutlined, EnvironmentOutlined, CheckCircleOutlined, ToolOutlined,
} from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useDispatchStore } from '@/stores/dispatch'
import { nowIsoString } from '@/utils'
import { pushTransitNotify, pushArrivedNotify, pushSignNotify } from '@/services/dingtalk'
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
 *  - GPS 入园 → markYardEnteredByGps 由真实 GPS 流触发
 *  - 车辆出厂 → markLeftYard 由真实 GPS 离厂信号触发
 *  - GPS 入客户园区 → markArrivedByGps 由真实 GPS 流触发
 *  - 客户签收 → signByCustomer 由 H5 签收页提交触发
 */
export function DevActions({ record, activeYardId }: Props) {
  // 生产构建物理删除
  if (!import.meta.env.DEV) return null

  const { markYardEnteredByGps, markLeftYard, markArrivedByGps, signByCustomer } = useDispatchStore.getState()

  const onSimulateGpsEnter = async () => {
    if (!activeYardId || !record.vehicleId) {
      message.warning('未派车，无法模拟 GPS 入库')
      return
    }
    const ts = nowIsoString()
    await markYardEnteredByGps(record.vehicleId, activeYardId, ts)
    message.success('演示：GPS 入库（已自动转 loading）')
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

  const onSimulateSign = async () => {
    const ts = nowIsoString()
    // mock 阶段用静态图片路径
    await signByCustomer(record.id, ts, ['/static/mock/signature-1.png'], '货物完好，已签收')
    await pushSignNotify({ dispatch: record, signedAt: ts, photoCount: 1 })
    message.success('演示：客户签收（订单完成）')
  }

  return (
    <Tooltip
      title="仅 mock 演示按钮，不会真实通知司机/客户；真实链路接通后此区域会下线"
      placement="left"
    >
      <Space size={4} wrap>
        <Button size="small" dashed icon={<EnvironmentOutlined />} onClick={onSimulateGpsEnter}>
          演示：GPS 入库
        </Button>
        <Button size="small" dashed icon={<CarOutlined />} onClick={onMarkLeftYard}>
          演示：车辆出厂
        </Button>
        <Button size="small" dashed icon={<EnvironmentOutlined />} onClick={onMarkArrivedByGps}>
          演示：GPS 入客户园区
        </Button>
        <Button size="small" dashed icon={<CheckCircleOutlined />} onClick={onSimulateSign}>
          演示：客户签收
        </Button>
        <Button size="small" type="text" icon={<ToolOutlined />} disabled>
          devtools
        </Button>
      </Space>
    </Tooltip>
  )
}