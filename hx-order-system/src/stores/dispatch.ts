import { create } from 'zustand'
import { mockDB } from '@/mock/db'
import type { Dispatch } from '@/types/dispatch'
import { getEnterYardAt, getLeaveYardAt } from '@/utils/dispatchTimeline'
import { nowIsoString } from '@/utils'
import { H5_BASE_URL } from '@/utils/h5BaseUrl'
import { generateSignToken, buildSignUrl } from '@/utils/signToken'

interface DispatchState {
  list: Dispatch[]
  loading: boolean
  load: () => Promise<void>
  save: (dispatch: Dispatch) => Promise<void>
  remove: (id: string) => Promise<void>
  getById: (id: string) => Dispatch | undefined

  // —— M3：库房主动推进 + 车辆 GPS 自动打卡 ——
  notifyDepart: (dispatchId: string, yardId: string, departAt: string) => Promise<void>
  notifyLoading: (dispatchId: string, yardId: string, notifiedAt: string) => Promise<void>
  markYardEnteredByGps: (vehicleId: string, yardId: string, enteredAt: string) => Promise<void>
  markYardLeftByGps: (vehicleId: string, yardId: string, leftAt: string) => Promise<void>

  // —— M2：库房装货完成 ——
  markLoadingCompleted: (dispatchId: string, yardId: string, completedAt: string) => Promise<void>

  // —— v0.2.0-M2：到货处理 4 步 ——
  /** 车辆出厂/在途（库房装货完成后自动链式触发，也可手动标记） */
  markLeftYard: (dispatchId: string, leftAt: string) => Promise<void>
  /** GPS 进入客户园区半径（自动；mock 来自位置流 tick） */
  markArrivedByGps: (vehicleId: string, arrivedAt: string) => Promise<void>
  /** 司机手动确认到达（H5「确认到达」按钮） */
  confirmArrivalByDriver: (dispatchId: string, confirmedAt: string) => Promise<void>
  /** 客户签收完成（客户签收 H5 上传照片 + 确认） */
  signByCustomer: (
    dispatchId: string,
    signedAt: string,
    photos: string[],
    note?: string,
  ) => Promise<void>
  /** v0.2.0-M2：库房员生成客户签收链接（leaving 状态触发） */
  generateSignUrl: (dispatchId: string, expiresInHours?: number) => Promise<{ url: string; token: string }>
}

/**
 * 推导 dispatch.status（基于 yardTimelines）—— v0.2.0-M2.2 版
 *
 * 业务流程（v0.2.0-M2.2 重新明确）：
 *   物流派车 → dispatched → GPS 入园（自动）→ entering
 *     → 库房「通知装货」→ loading → 库房「装货完成」→ leaving
 *     → GPS 离厂（自动）→ completed
 *
 * 优先级（自上而下）：
 *  1) 客户已签收（signedAt）→ completed
 *  2) 司机已确认（driverConfirmedAt）→ customer_signed（实际签名态之前的等待签收）
 *  3) GPS 已到达客户园区（arrivedByGpsAt）→ driver_confirmed
 *  4) 车辆已出厂（leftYardAt）→ in_transit
 *  5) 所有园区都 leftAt → completed（兼容旧数据无 leftYardAt 场景）
 *  6) 任一园区 loadingCompletedAt → leaving
 *  7) 任一园区 loadingNotifiedAt 且未装完 → loading（库房放行装货）
 *  8) 任一园区 enteredAt（无 loadingNotified）→ entering（GPS 入园，等待库房放行）
 *  9) 任一园区 notifyDepartAt / notifiedAt → dispatched
 *  10) 保留旧 status
 *
 * 关键约束（v0.2.0-M2.2）：entering 优先级 > loading
 *  - 即使数据脏（旧 entering 数据 + 旧 loading 数据共存），状态仍卡在 entering
 *  - 库房员必须主动点「通知装货」才能推到 loading
 *  - 避免库房员漏点「通知装货」导致订单自动跳到 loading
 */
function deriveStatus(d: Dispatch): Dispatch['status'] {
  const tl = d.yardTimelines || []
  if (tl.length === 0) return d.status

  // 客户已签收 → 直接 completed（终态）
  const anySigned = tl.some((y) => y.signedAt)
  if (anySigned) return 'completed'

  // 司机已确认 → 等待客户签收
  const anyDriverConfirmed = tl.some((y) => y.driverConfirmedAt)
  if (anyDriverConfirmed) return 'driver_confirmed'

  // GPS 已到客户园区 → 等待司机确认
  const anyArrivedByGps = tl.some((y) => y.arrivedByGpsAt)
  if (anyArrivedByGps) return 'arrived_by_gps'

  // 车辆已出厂 → 在途
  const anyLeftYard = tl.some((y) => y.leftYardAt)
  if (anyLeftYard) return 'in_transit'

  // 兼容旧数据：无 leftYardAt 但所有园区都已 leftAt
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

  /** 库房"通知出发"（v0.2.0-M2.2 业务调整）：
   *  - 仅写 notifyDepartAt，状态保持 dispatched
   *  - 不再链式触发 loading（库房员对司机的"出发"放行 ≠ "装货"放行）
   *  - 真正进入 loading 需要走两步：
   *    1) GPS 自动入园 → 状态转 entering
   *    2) 库房员点「通知装货」→ 状态转 loading
   */
  notifyDepart: async (dispatchId, yardId, departAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        y.yardId === yardId && !y.notifyDepartAt
          ? { ...y, notifyDepartAt: departAt }
          : y,
      ),
    }
    await get().save(updated)
  },

  /**
   * 库房"通知装货"（v0.2.0-M2.2 业务调整）：
   *  - 前提：dispatch 必须在 entering 状态（GPS 已入园，等待库房放行）
   *  - 不自动补写 enteredAt（防御性写法：缺 GPS 信号就 disabled，不允许"假装入园"）
   *  - 写 loadingNotifiedAt 后 deriveStatus 自动转 loading
   */
  notifyLoading: async (dispatchId, yardId, notifiedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 状态守卫：仅 entering 状态可通知装货
    // 进入 loading 的路径必须是「GPS 入园 → 库房放行」两步，缺一不可
    if (d.status !== 'entering') {
      throw new Error(
        `当前状态「${d.status}」不允许通知装货（需先 GPS 入园进入 entering 状态）`,
      )
    }
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

  // ====== v0.2.0-M2：到货处理 4 步 ======

  /** 车辆出厂/在途（库房装货完成后自动链式触发） */
  markLeftYard: async (dispatchId, leftAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        y.leftAt && !y.leftYardAt ? { ...y, leftYardAt: leftAt } : y,
      ),
    }
    await get().save(updated)
  },

  /** GPS 入客户园区（mock：来自位置流 tick，自动反查 dispatch） */
  markArrivedByGps: async (vehicleId, arrivedAt) => {
    const d = get().list.find(
      (x) =>
        x.vehicleId === vehicleId &&
        (x.status === 'in_transit' || x.status === 'arrived_by_gps') &&
        x.yardTimelines.length > 0,
    )
    if (!d) {
      console.warn(`[dispatch] GPS 入客户园区未匹配：vehicleId=${vehicleId}`)
      return
    }
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) => {
        // 幂等：所有 timeline 都标记（演示用）
        if (y.arrivedByGpsAt) return y
        return { ...y, arrivedByGpsAt: arrivedAt }
      }),
    }
    await get().save(updated)
  },

  /** 司机手动确认到达 */
  confirmArrivalByDriver: async (dispatchId, confirmedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        !y.driverConfirmedAt ? { ...y, driverConfirmedAt: confirmedAt } : y,
      ),
    }
    await get().save(updated)
  },

  /** 客户签收完成 */
  signByCustomer: async (dispatchId, signedAt, photos, note) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 状态守卫：仅允许已到客户园区之后的状态签收
    const SIGN_ALLOWED_STATUSES: DispatchStatus[] = [
      'arrived_by_gps',
      'driver_confirmed',
      'customer_signed',
    ]
    if (!SIGN_ALLOWED_STATUSES.includes(d.status)) {
      throw new Error(`当前状态「${d.status}」不允许签收（车辆尚未到达客户园区）`)
    }
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        !y.signedAt ? { ...y, signedAt, signaturePhotos: photos, signatureNote: note } : y,
      ),
    }
    await get().save(updated)
  },

  /** 库房员生成客户签收链接（v0.2.0-M2） */
  generateSignUrl: async (dispatchId, expiresInHours = 24) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 状态守卫：仅允许装货完成及之后的中间态生成签收链接
    // 业务原因：装货完成意味着货物已离开园区，可发给客户做签收；
    //         之前的中间态生成会让客户看到"还没装完"的订单，体验混乱。
    const SIGN_URL_ALLOWED_STATUSES: DispatchStatus[] = [
      'leaving',
      'in_transit',
      'arrived_by_gps',
      'driver_confirmed',
      'customer_signed',
    ]
    if (!SIGN_URL_ALLOWED_STATUSES.includes(d.status)) {
      throw new Error(
        `当前状态「${d.status}」不允许生成签收链接（需进入 leaving 及之后状态）`,
      )
    }
    const token = generateSignToken(dispatchId, expiresInHours)
    const url = buildSignUrl(token, H5_BASE_URL)
    const updated: Dispatch = {
      ...d,
      signUrl: url,
      signUrlGeneratedAt: nowIsoString(),
      signUrlExpiresInHours: expiresInHours,
    }
    await get().save(updated)
    return { url, token }
  },
}))
