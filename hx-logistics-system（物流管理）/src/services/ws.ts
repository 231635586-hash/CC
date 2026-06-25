/**
 * WebSocket 客户端（M1 桩实现）
 *
 * 当前阶段：未对接真实后端，提供事件订阅 API 占位
 * - on/off：注册/解绑事件监听
 * - emit：内部触发事件（M1 阶段不连真实 ws，但保留接口便于未来切换）
 *
 * 接入真实后端时，只需把 createSocket() 中的 emit 替换为 ws.onmessage 即可
 */
type Listener = (payload: unknown) => void

interface SocketStub {
  on(event: string, cb: Listener): () => void
  off(event: string, cb: Listener): void
  emit(event: string, payload: unknown): void
}

function createSocket(): SocketStub {
  const listeners = new Map<string, Set<Listener>>()

  return {
    on(event, cb) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(cb)
      // 返回解绑函数
      return () => listeners.get(event)?.delete(cb)
    },
    off(event, cb) {
      listeners.get(event)?.delete(cb)
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((cb) => {
        try {
          cb(payload)
        } catch (e) {
          console.error(`[ws] listener for ${event} threw:`, e)
        }
      })
    },
  }
}

const socket = createSocket()

/**
 * 订阅事件；返回解绑函数（在 useEffect cleanup 中调用）
 *
 * @example
 *   useEffect(() => on('dispatch_update', cb), [])
 */
export function on(event: string, cb: Listener): () => void {
  return socket.on(event, cb)
}

export function off(event: string, cb: Listener): void {
  socket.off(event, cb)
}

/** 触发事件（M1 桩；未来可由真实 ws.onmessage 调用） */
export function emit(event: string, payload: unknown): void {
  socket.emit(event, payload)
}

/** 常用事件名常量 */
export const WS_EVENTS = {
  DISPATCH_UPDATE: 'dispatch_update',
  VEHICLE_LOCATION_UPDATE: 'vehicle_location_update',
} as const
