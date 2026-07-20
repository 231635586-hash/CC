/**
 * v0.3.0-M2.2 + O2：全局错误处理工具
 *
 * Why：
 *  - 当前单页面脚本错误会白屏（如 mock 数据缺字段 / undefined property）
 *  - Promise rejection 没有统一捕获
 *  - 需要统一跳转友好错误页 + 控制台记录
 *
 * 设计：
 *  - initGlobalErrorHandler()：在 App.vue onLaunch 调用一次
 *  - 捕获 JS 运行时错误（uni.onError + window.onerror）
 *  - 捕获 Promise rejection（unhandledrejection）
 *  - 重复错误去重（5s 内相同消息不重复跳页）
 *  - 提供跳转错误页 + 错误信息存储
 */

let lastErrorTime = 0
let lastErrorMsg = ''
const ERROR_DEDUPE_MS = 5000

/**
 * 跳转错误页
 * @param error 错误对象或错误消息
 * @param silent 静默模式（仅记录，不跳转；用于开发调试）
 */
export function goToErrorPage(error: Error | string, silent = false): void {
  const message = typeof error === 'string' ? error : error?.message || '未知错误'
  const stack = typeof error === 'string' ? '' : error?.stack || ''

  // 控制台记录（开发调试用）
  console.error('[GlobalError]', message, stack)

  // 静默模式：仅记录，不跳转
  if (silent) return

  // 去重：5s 内相同消息不重复跳页
  const now = Date.now()
  if (now - lastErrorTime < ERROR_DEDUPE_MS && lastErrorMsg === message) {
    console.warn('[GlobalError] 5s 内相同错误，已跳过跳转')
    return
  }
  lastErrorTime = now
  lastErrorMsg = message

  // 存到 localStorage（错误页读取展示）
  try {
    uni.setStorageSync('__last_error', { message, stack, timestamp: now })
  } catch (e) {
    // 忽略 storage 错误
  }

  // 跳转错误页（关闭所有页面再打开）
  // 注意：uni.reLaunch 会关闭所有页面再打开，避免错误页被栈顶页面挡住
  try {
    uni.reLaunch({ url: '/pages/error/index' })
  } catch (e) {
    // reLaunch 失败时 fallback 到 redirectTo
    try {
      uni.redirectTo({ url: '/pages/error/index' })
    } catch (e2) {
      console.error('[GlobalError] 跳转错误页失败', e2)
    }
  }
}

/**
 * 初始化全局错误处理（App.vue onLaunch 调用一次）
 */
export function initGlobalErrorHandler(): void {
  if (typeof uni === 'undefined') return

  // 1. uni.onError 捕获 JS 运行时错误
  try {
    uni.onError((error: string) => {
      goToErrorPage(error || 'JS 运行时错误')
    })
  } catch (e) {
    console.warn('[GlobalError] uni.onError 注册失败', e)
  }

  // 2. window.onerror 兜底（捕获 uni.onError 未覆盖的错误）
  if (typeof window !== 'undefined') {
    const prevOnError = window.onerror
    window.onerror = function (message, source, lineno, colno, error) {
      // 先调用之前的 onError（如果有）
      if (typeof prevOnError === 'function') {
        const r = prevOnError.call(this, message, source, lineno, colno, error)
        if (r === true) return true
      }
      // 捕获
      goToErrorPage(error?.message || String(message) || '未知错误')
      return false // 不阻止默认错误处理
    }

    // 3. unhandledrejection 捕获 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      const message = reason?.message || String(reason) || 'Promise rejection'
      goToErrorPage(message)
    })
  }

  console.log('[GlobalError] 全局错误处理已初始化')
}