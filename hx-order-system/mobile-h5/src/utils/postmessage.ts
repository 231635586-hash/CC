/**
 * 跨 origin 通信工具（mobile-h5 → Web 端）
 *
 * 协议：
 * - H5 通过 window.opener.postMessage 通知库房 Web 端
 * - Web 端通过 services/crossOrigin.ts 监听
 * - targetOrigin 严格限制为 'http://localhost:5177'（PC 端 vite 端口）
 *
 * M3 变更：
 *  - 原 5175 是仓库系统端口，已修正为订单系统端口 5177
 *  - 扫码 YARD_ENTER / YARD_LEFT 流程废除（GPS 自动），保留协议兼容
 *  - 新增 H5_PULL_NOTIFICATIONS 协议用于 H5 主动拉取推送
 */

const WEB_ORIGIN = 'http://localhost:5177'

export type CrossOriginPayload =
  | { type: 'YARD_ENTER'; token: string; yardId: string; enteredAt: string }
  | { type: 'YARD_LEFT'; token: string; yardId: string; leftAt: string }

/** 通知 Web 端 + 延迟关闭当前 H5 窗口 */
export function notifyWebAndClose(payload: CrossOriginPayload, delayMs = 300) {
  try {
    if (window.opener) {
      window.opener.postMessage(payload, WEB_ORIGIN)
    }
  } catch (e) {
    console.error('[postmessage] failed:', e)
  }
  setTimeout(() => {
    window.close()
  }, delayMs)
}

/** 仅通知（不关闭），用于多次操作场景 */
export function notifyWeb(payload: CrossOriginPayload) {
  try {
    if (window.opener) {
      window.opener.postMessage(payload, WEB_ORIGIN)
    }
  } catch (e) {
    console.error('[postmessage] failed:', e)
  }
}