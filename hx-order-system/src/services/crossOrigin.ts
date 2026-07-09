/**
 * 跨 origin 通信桥接（M2 库房 Web ↔ 司机端 H5）
 *
 * 协议：
 * - driver H5 通过 `window.opener.postMessage(msg, 'http://localhost:5175')` 通知 Web 端
 * - Web 端通过本服务监听 `message` 事件
 * - 校验 origin 白名单 → 解析 payload → 调用 dispatch store 写时间戳
 *
 * 安全：仅信任 ALLOWED_ORIGINS 列表中的 origin；非白名单丢弃
 */

import { useDispatchStore } from '@/stores/dispatch'

/** postMessage 协议 */
export type CrossOriginMessage =
  | { type: 'YARD_ENTER'; token: string; yardId: string; enteredAt: string }
  | { type: 'YARD_LEFT'; token: string; yardId: string; leftAt: string }

/** 信任的 origin 白名单（开发期 + 生产期域名） */
const ALLOWED_ORIGINS = [
  'http://localhost:5177',
  // 生产期追加：'https://h5.haoxiang.example'
]

let registered = false

/** 注册跨 origin 监听器（仅注册一次） */
export function registerCrossOriginListener() {
  if (registered || typeof window === 'undefined') return
  registered = true

  window.addEventListener('message', async (e: MessageEvent) => {
    if (!ALLOWED_ORIGINS.includes(e.origin)) return
    const data = e.data as CrossOriginMessage | undefined
    if (!data || typeof data !== 'object' || !('type' in data)) return

    const store = useDispatchStore.getState()

    try {
      if (data.type === 'YARD_ENTER') {
        await store.markYardEntered(data.token, data.yardId, data.enteredAt)
      } else if (data.type === 'YARD_LEFT') {
        await store.markYardLeft(data.token, data.yardId, data.leftAt)
      }
    } catch (err) {
      console.error('[crossOrigin] dispatch store update failed:', err)
    }
  })
}