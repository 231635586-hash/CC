import { create } from 'zustand'
import { mockDB } from '@/mock/db'
import type { Dispatch } from '@/types/dispatch'
import { getEnterYardAt, getLeaveYardAt } from '@/utils/dispatchTimeline'
import { nowIsoString } from '@/utils'

interface DispatchState {
  list: Dispatch[]
  loading: boolean
  load: () => Promise<void>
  save: (dispatch: Dispatch) => Promise<void>
  remove: (id: string) => Promise<void>
  getById: (id: string) => Dispatch | undefined

  // —— M3 新增：库房主动推进 + 车辆 GPS 自动打卡 ——
  /** 库房"通知出发"（派车后推送司机 H5） */
  notifyDepart: (dispatchId: string, yardId: string, departAt: string) => Promise<void>
  /** 库房"通知装货"（dispatch.status → loading） */
  notifyLoading: (dispatchId: string, yardId: string, notifiedAt: string) => Promise<void>
  /** 车辆 GPS 进入园区半径（自动；mock 来自位置流 tick） */
  markYardEnteredByGps: (vehicleId: string, yardId: string, enteredAt: string) => Promise<void>
  /** 车辆 GPS 离开园区半径（自动；mock 来自位置流 tick） */
  markYardLeftByGps: (vehicleId: string, yardId: string, leftAt: string) => Promise<void>

  // —— M2 保留：库房装货完成 ——
  markLoadingCompleted: (dispatchId: string, yardId: string, completedAt: string) => Promise<void>
}

/**
 * 推导 dispatch.status（基于 yardTimelines）—— M3 版
 *
 * 优先级（自上而下）：
 *  1) 所有园区都 leftAt → completed
 *  2) 任一园区 loadingCompletedAt → leaving
 *  3) 任一园区 loadingNotifiedAt 且未装完 → loading（M3 新中间态）
 *  4) 任一园区 enteredAt（无 loadingNotified）→ entering
 *  5) 任一园区 notifyDepartAt / notifiedAt → dispatched
 *  6) 保留旧 status
 */
function deriveStatus(d: Dispatch): Dispatch['status'] {
  const tl = d.yardTimelines || []
  if (tl.length === 0) return d.status

  const allLeft = tl.every((y) => y.leftAt)
  if (allLeft) return 'completed'

  const anyLoadingDone = tl.some((y) => y.loadingCompletedAt)
  if (anyLoadingDone) return 'leaving'

  const anyLoadingNotified = tl.some((y) => y.loadingNotifiedAt && !y.loadingCompletedAt)
  if (anyLoadingNotified) return 'loading'

  const anyEntered = tl.some((y) => y.enteredAt)
  if (anyEntered) return 'entering'

  const anyNotified = tl.some((y) => y.notifyDepartAt || y.notifiedAt)
  if (anyNotified) return 'dispatched'

  return d.status
}

/** 给 dispatch 补齐派生字段（enterYardAt / leaveYardAt） */
function withDerived(d: Dispatch): Dispatch {
  return {
    ...d,
    enterYardAt: getEnterYardAt(d),
    leaveYardAt: getLeaveYardAt(d),
  }
}

/** 调车单 Store */
export const useDispatchStore = create<DispatchState>((set, get) => ({
  list: [],
  loading: false,
  load: async () => {
    set({ loading: true })
    const list = await mockDB.listDispatches()
    set({ list: list.map(withDerived), loading: false })
  },
  save: async (dispatch) => {
    const updated = withDerived({ ...dispatch, status: deriveStatus(dispatch) })
    await mockDB.saveDispatch(updated)
    await get().load()
  },
  remove: async (id) => {
    await mockDB.deleteDispatch(id)
    await get().load()
  },
  getById: (id) => get().list.find((d) => d.id === id),

  // ====== M3 新 action ======

  /** 库房"通知出发" */
  notifyDepart: async (dispatchId, yardId, departAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        y.yardId === yardId ? { ...y, notifyDepartAt: departAt } : y,
      ),
    }
    await get().save(updated)
  },

  /** 库房"通知装货" → status 变 loading（中间态） */
  notifyLoading: async (dispatchId, yardId, notifiedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        y.yardId === yardId && !y.loadingNotifiedAt
          ? { ...y, loadingNotifiedAt: notifiedAt }
          : y,
      ),
    }
    await get().save(updated)
  },

  /** 车辆 GPS 入园（mock：来自位置流 tick） */
  markYardEnteredByGps: async (vehicleId, yardId, enteredAt) => {
    // 反查：派车后（dispatched）的调度单，且 dispatch.vehicleId = vehicleId，yardTimelines 含 yardId
    const d = get().list.find(
      (x) =>
        x.vehicleId === vehicleId &&
        (x.status === 'dispatched' || x.status === 'entering' || x.status === 'loading') &&
        x.yardTimelines.some((y) => y.yardId === yardId),
    )
    if (!d) {
      console.warn(`[dispatch] GPS 入园未匹配：vehicleId=${vehicleId} yardId=${yardId}`)
      return
    }
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) => {
        if (y.yardId !== yardId) return y
        // 幂等：已 enteredAt 则不覆盖
        if (y.enteredAt) return y
        return { ...y, enteredAt, enteredVia: 'gps' as const }
      }),
    }
    await get().save(updated)
  },

  /** 车辆 GPS 离厂（mock：来自位置流 tick） */
  markYardLeftByGps: async (vehicleId, yardId, leftAt) => {
    const d = get().list.find(
      (x) =>
        x.vehicleId === vehicleId &&
        (x.status === 'entering' || x.status === 'loading' || x.status === 'leaving') &&
        x.yardTimelines.some((y) => y.yardId === yardId),
    )
    if (!d) {
      console.warn(`[dispatch] GPS 离厂未匹配：vehicleId=${vehicleId} yardId=${yardId}`)
      return
    }
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) => {
        if (y.yardId !== yardId) return y
        if (y.leftAt) return y
        return { ...y, leftAt, leftVia: 'gps' as const }
      }),
    }
    await get().save(updated)
  },

  // ====== 旧扫码 stub 已下线（M3 GPS 自动打卡替代）======

  markLoadingCompleted: async (dispatchId, yardId, completedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        y.yardId === yardId ? { ...y, loadingCompletedAt: completedAt } : y,
      ),
    }
    await get().save(updated)
  },
}))
