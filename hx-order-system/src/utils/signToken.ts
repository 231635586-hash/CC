/**
 * 客户签收 token 工具（v0.2.0-M2）
 *
 * 用途：
 *  - PC 端订单详情生成签收链接（带 token + 有效期）
 *  - 调度员将链接发给客户（微信/短信）
 *  - 客户打开链接 → H5 解析 token → 校验 → 进入签收页面
 *
 * 安全说明（mock 阶段简化）：
 *  - 用 base64(JSON) 编码，不签名
 *  - 真实阶段需 HMAC 签名 + 服务端校验
 *  - 当前实现仅用于演示流程完整性
 */

export interface SignTokenPayload {
  dispatchId: string
  issuedAt: number
  expiresAt: number
  nonce: string
}

/**
 * 生成签收 token
 * @param dispatchId 调车单 ID
 * @param expiresInHours 有效期（小时），默认 24
 */
export function generateSignToken(dispatchId: string, expiresInHours = 24): string {
  const now = Date.now()
  const payload: SignTokenPayload = {
    dispatchId,
    issuedAt: now,
    expiresAt: now + expiresInHours * 60 * 60 * 1000,
    nonce: Math.random().toString(36).slice(2, 10),
  }
  // 用 base64 编码 JSON（兼容中文）
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

/**
 * 解析签收 token
 * @returns payload 或 null（无效/过期）
 */
export function parseSignToken(token: string | null | undefined): SignTokenPayload | null {
  if (!token) return null
  try {
    const decoded = decodeURIComponent(escape(atob(token)))
    const payload = JSON.parse(decoded) as SignTokenPayload
    if (typeof payload.dispatchId !== 'string') return null
    if (typeof payload.expiresAt !== 'number') return null
    if (Date.now() > payload.expiresAt) return null
    return payload
  } catch {
    return null
  }
}

/**
 * 拼接客户签收链接
 * @param token 签收 token
 * @param h5BaseUrl H5 基础地址（默认 http://localhost:5181/）
 *
 * 注意：uni-app H5 默认用 hash 路由，所以链接用 '/?token=xxx' 形式
 * mobile-h5 入口 orders/index.vue 的 onLoad 会检测 token 并 redirectTo 到 customer/sign
 */
export function buildSignUrl(token: string, h5BaseUrl: string): string {
  // 移除可能的尾部斜杠，保留协议+域名+端口
  const base = h5BaseUrl.replace(/\/$/, '')
  return `${base}/?token=${encodeURIComponent(token)}`
}

/**
 * 计算 token 剩余有效期（小时），用于 UI 展示
 */
export function getTokenRemainingHours(payload: SignTokenPayload): number {
  const ms = payload.expiresAt - Date.now()
  return Math.max(0, Math.floor(ms / (60 * 60 * 1000)))
}