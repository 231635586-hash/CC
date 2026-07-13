/**
 * 跨 origin 通信桥接（M2 库房 Web ↔ 司机端 H5）
 *
 * 协议：
 * - driver H5 通过 `window.opener.postMessage(msg, 'http://localhost:5177')` 通知 Web 端
 * - Web 端通过本服务监听 `message` 事件
 * - 校验 origin 白名单 → 解析 payload → 调用 dispatch store 写时间戳
 *
 * 安全：仅信任 ALLOWED_ORIGINS 列表中的 origin；非白名单丢弃
 *
 * M3 变更：
 * - 旧 YARD_ENTER / YARD_LEFT 协议已废弃（M3 改用车辆硬件 GPS 自动打卡）
 * - 仅保留对老 message type 的 silent drop（避免老 H5 链接静默失败）
 * - 真实阶段接入推送通道后，本文件可整体下线
 */

/** 信任的 origin 白名单（开发期 + 生产期域名） */
const ALLOWED_ORIGINS = [
  'http://localhost:5177',
  // 生产期追加：'https://h5.haoxiang.example'
]

/** 旧协议 message type（M3 已废弃，仅做兼容识别） */
type DeprecatedMessageType = 'YARD_ENTER' | 'YARD_LEFT'

interface DeprecatedMessage {
  type: DeprecatedMessageType
  token: string
  yardId: string
  enteredAt?: string
  leftAt?: string
}

let registered = false

/** 注册跨 origin 监听器（仅注册一次） */
export function registerCrossOriginListener() {
  if (registered || typeof window === 'undefined') return
  registered = true

  window.addEventListener('message', (e: MessageEvent) => {
    if (!ALLOWED_ORIGINS.includes(e.origin)) return
    const data = e.data as DeprecatedMessage | undefined
    if (!data || typeof data !== 'object' || !('type' in data)) return

    // M3 废弃：扫码入场/离场协议已由 GPS 自动打卡替代
    // 旧 H5 链接到此会被静默丢弃，不再尝试调 store（store 中已无对应 action）
    if (data.type === 'YARD_ENTER' || data.type === 'YARD_LEFT') {
      console.warn(
        '[crossOrigin] 旧扫码协议 ' + data.type + ' 已废弃，请使用车辆硬件 GPS 自动打卡',
      )
      return
    }
  })
}