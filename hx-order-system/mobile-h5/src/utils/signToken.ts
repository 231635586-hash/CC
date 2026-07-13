/**
 * 客户签收 token 校验工具（H5 端）
 *
 * PC 端用 src/utils/signToken.ts 生成 token；
 * H5 端用本工具解析并校验（解析逻辑保持一致：base64 → JSON → 校验有效期）
 *
 * mock 阶段简化（无 HMAC），仅用于演示流程。
 */

export interface SignTokenPayload {
  dispatchId: string
  issuedAt: number
  expiresAt: number
  nonce: string
}

/**
 * 解析 token（与 PC 端 generateSignToken 互逆）
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
 * 从 URL query 提取 token
 */
export function extractTokenFromUrl(): string | null {
  // uni-app 端通过 onLoad(query) 接收 query；此处兼容直接读 window.location
  try {
    if (typeof window !== 'undefined' && window.location) {
      const search = window.location.search.replace(/^\?/, '')
      const params = new URLSearchParams(search)
      return params.get('token')
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * 计算 token 剩余有效期（小时）
 */
export function getTokenRemainingHours(payload: SignTokenPayload): number {
  const ms = payload.expiresAt - Date.now()
  return Math.max(0, Math.floor(ms / (60 * 60 * 1000)))
}

/**
 * 格式化过期时间
 */
export function formatExpiresAt(payload: SignTokenPayload): string {
  const d = new Date(payload.expiresAt)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).toString().padStart(2, '0')
  const mi = String(d.getMinutes()).toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}