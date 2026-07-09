/**
 * GPS 位置流 → 调车单 store 桥接（M3 阶段）
 *
 * 职责：监听 gpsStream 推送的 pings，比对每辆车的"上一 tick 是否在园"边界，
 *      在状态翻转瞬间调用 useDispatchStore 的 GPS action。
 *
 * 设计要点：
 *  - 桥接只暴露一个 bindGpsToDispatch()，由 App.tsx 顶层 useEffect 启动一次
 *  - 维护 prevState / prevYard 内存 Map（不需要持久化，刷新后从新 tick 重新建立）
 *  - 边界仅在 boolean 翻转瞬间触发，重复进入不重复打点
 */

import { subscribeGps, type GpsPing } from './gpsStream'
import { useDispatchStore } from '@/stores/dispatch'

/** vehicleId -> 上一 tick 是否在园（boolean） */
const prevInYard: Map<string, boolean> = new Map()
/** vehicleId -> 上一 tick 所在 yardId */
const prevYardId: Map<string, string> = new Map()
let bound = false

export function bindGpsToDispatch(): () => void {
  if (bound) return () => {}
  bound = true

  const unsubscribe = subscribeGps(async (pings: GpsPing[]) => {
    for (const p of pings) {
      const wasIn = prevInYard.get(p.vehicleId) ?? false
      const nowIn = !!p.inYard
      const store = useDispatchStore.getState()

      // 入园：false → true
      if (!wasIn && nowIn && p.inYard) {
        try {
          await store.markYardEnteredByGps(p.vehicleId, p.inYard.yardId, p.updatedAt)
        } catch (e) {
          console.error('[gpsBridge] enter failed', e)
        }
      }
      // 离厂：true → false（注意：跨园区时 yard 切换也算离厂 → 再次入园）
      else if (wasIn && !nowIn) {
        const yardId = prevYardId.get(p.vehicleId)
        if (yardId) {
          try {
            await store.markYardLeftByGps(p.vehicleId, yardId, p.updatedAt)
          } catch (e) {
            console.error('[gpsBridge] leave failed', e)
          }
        }
      }

      prevInYard.set(p.vehicleId, nowIn)
      if (p.inYard) prevYardId.set(p.vehicleId, p.inYard.yardId)
      else prevYardId.delete(p.vehicleId)
    }
  })

  return () => {
    bound = false
    unsubscribe()
  }
}

/** 重置边界（演示用） */
export function resetGpsBridge() {
  prevInYard.clear()
  prevYardId.clear()
}
