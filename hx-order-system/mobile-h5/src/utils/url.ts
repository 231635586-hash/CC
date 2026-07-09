/**
 * URL 工具（mobile-h5 端）
 *
 * 处理 scan-in / scan-out URL 中的 base64 snapshot 字段
 * Web 端 base64(encodeURIComponent(JSON.stringify(snapshot)))
 * H5 端：atob(decodeURIComponent(snapshot)) → JSON.parse
 */

export interface ScanSnapshot {
  dispatchNo: string
  dispatchId: string
  yardId: string
  yardName: string
  plateNo: string
  driverName: string
  action: 'enter' | 'leave'
}

/** 解析 base64 snapshot 字符串 */
export function parseSnapshot(snapshotB64: string | undefined): ScanSnapshot | null {
  if (!snapshotB64) return null
  try {
    const json = decodeURIComponent(atob(snapshotB64))
    return JSON.parse(json) as ScanSnapshot
  } catch (e) {
    console.error('[url] parseSnapshot failed:', e)
    return null
  }
}