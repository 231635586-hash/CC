/**
 * 剪贴板写入工具（兜底方案）
 *
 * 业务场景：库房员/调度员点击「复制签收链接」按钮
 *  - 现代浏览器：navigator.clipboard.writeText（异步 Promise）
 *  - HTTP 环境（localhost 之外）：navigator.clipboard 可能为 undefined 或失败
 *  - 老浏览器 / 隐私模式：execCommand('copy') 兜底
 *
 * 调用方：OrderDetailPage / WarehouseQueuePage 的「复制链接」按钮
 *
 * @returns true=复制成功；false=兜底也已失败（极端情况）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1) 现代 API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 权限拒绝 / 非安全上下文 → 走兜底
  }

  // 2) 兜底：textarea + execCommand
  try {
    if (typeof document === 'undefined') return false
    const ta = document.createElement('textarea')
    ta.value = text
    // 防止页面滚动跳变
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    ta.style.pointerEvents = 'none'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}