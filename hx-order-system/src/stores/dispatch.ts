import { create } from 'zustand'
import { mockDB } from '@/mock/db'
import type { Dispatch, YardTimeline } from '@/types/dispatch'
import { getEnterYardAt, getLeaveYardAt } from '@/utils/dispatchTimeline'
import { nowIsoString } from '@/utils'

/** save 可选项：autoDerive=true 让 store 根据 yardTimelines 自动推导 status
 * 业务层（handleConfirm/handleDispatch 等）调用时不传，保持传入的 status
 * markXxx 时间轴操作调用时传 true，让状态自动跟随 timeline 推进
 */
interface SaveOptions {
  autoDerive?: boolean
}

interface DispatchState {
  list: Dispatch[]
  loading: boolean
  load: () => Promise<void>
  save: (dispatch: Dispatch, opts?: SaveOptions) => Promise<void>
  remove: (id: string) => Promise<void>
  getById: (id: string) => Dispatch | undefined

  // —— M2.2 v2 状态机：GPS / 扫码统一入场 ——
  /** 司机扫码排队（无 GPS 场景） */
  markYardQueuedByScan: (dispatchId: string, yardId: string, queuedAt: string) => Promise<void>
  /** GPS 检测到场（有 GPS 场景，统一走 queued） */
  markYardQueuedByGps: (vehicleId: string, yardId: string, queuedAt: string) => Promise<void>
  /** 库房员通知入场 + 道闸开闸（queued → entering） */
  triggerGateOpen: (dispatchId: string, yardId: string, enteredAt: string) => Promise<void>
  /** 司机确认到达（driver_confirmed → completed 链式） */
  completeByDriverConfirm: (dispatchId: string) => Promise<void>

  // —— M3：库房主动推进 + 车辆 GPS 自动打卡 ——
  notifyDepart: (dispatchId: string, yardId: string, departAt: string) => Promise<void>
  notifyLoading: (dispatchId: string, yardId: string, notifiedAt: string) => Promise<void>
  markYardLeftByGps: (vehicleId: string, yardId: string, leftAt: string) => Promise<void>

  // —— M2：库房装货完成 ——
  markLoadingCompleted: (
    dispatchId: string,
    yardId: string,
    completedAt: string,
    overtime?: { reason?: string; department?: string; ownerName?: string },
  ) => Promise<void>

  // —— v0.2.0-M2：到货处理 ——
  /** 车辆出厂/在途（库房装货完成后自动链式触发，也可手动标记） */
  markLeftYard: (dispatchId: string, leftAt: string) => Promise<void>
  /** GPS 进入客户园区半径（自动；mock 来自位置流 tick）— 注意：仅写入 arrivedByGpsAt 字段，不再驱动状态 */
  markArrivedByGps: (vehicleId: string, arrivedAt: string) => Promise<void>
  /** 司机手动确认到达（H5「确认到达」按钮）— 确认后自动链式触发 completeByDriverConfirm */
  confirmArrivalByDriver: (dispatchId: string, confirmedAt: string) => Promise<void>
  // ❌ v0.3.0-M2.2 删除:signByCustomer / generateSignUrl（客户签收全链路已下线）
}

/**
 * 推导 dispatch.status（基于 yardTimelines）—— v0.3.0-M2.2 版
 *
 * 业务流程（M2.2 v2 重新明确）：
 *   物流派车 → dispatched → 排队登记（GPS 自动 / 司机扫码统一走 queued）
 *     → 库房「通知入场」（道闸开闸）→ entering
 *     → 库房「通知装货」→ loading → 库房「装货完成」→ leaving
 *     → GPS 离厂（自动）→ in_transit
 *     → 司机「确认到达」→ driver_confirmed → 自动链式 completed
 *
 * 优先级（自上而下）：
 *  1) 所有园区都已 leftAt && 所有园区都已 driverConfirmedAt → completed
 *  2) 任一园区 driverConfirmedAt 存在 → driver_confirmed
 *  3) 任一园区 leftAt 存在（未 driverConfirmedAt）→ in_transit
 *  4) 任一园区 loadingCompletedAt 存在（未 leftAt）→ leaving
 *  5) 任一园区 loadingNotifiedAt 存在（未 loadingCompletedAt）→ loading
 *  6) 任一园区 enteredAt 存在（未 loadingNotifiedAt）→ entering
 *  7) 任一园区 queuedAt 存在（未 enteredAt）→ queued
 *  8) 默认：dispatched（司机已确认派车，但未登记排队）
 */
function deriveStatus(d: Dispatch): Dispatch['status'] {
  const tl = d.yardTimelines || []
  if (tl.length === 0) return d.status

  // 1) 全部完成（终态）— 所有园区都已离场 + 司机已确认
  if (tl.every((y) => y.leftAt) && tl.every((y) => y.driverConfirmedAt)) {
    return 'completed'
  }

  // 2) 任一园区 driverConfirmedAt 存在 → driver_confirmed
  if (tl.some((y) => y.driverConfirmedAt)) return 'driver_confirmed'

  // 3) 任一园区 leftAt 存在（未 driverConfirmedAt）→ in_transit
  if (tl.some((y) => y.leftAt)) return 'in_transit'

  // 4) 任一园区 loadingCompletedAt 存在（未 leftAt）→ leaving
  if (tl.some((y) => y.loadingCompletedAt && !y.leftAt)) return 'leaving'

  // 5) 任一园区 loadingNotifiedAt 存在（未 loadingCompletedAt）→ loading
  if (tl.some((y) => y.loadingNotifiedAt && !y.loadingCompletedAt)) return 'loading'

  // 6) 任一园区 enteredAt 存在（未 loadingNotifiedAt）→ entering
  if (tl.some((y) => y.enteredAt && !y.loadingNotifiedAt)) return 'entering'

  // 7) 任一园区 queuedAt 存在（未 enteredAt）→ queued
  if (tl.some((y) => y.queuedAt && !y.enteredAt)) return 'queued'

  // 8) 默认：dispatched
  return 'dispatched'
}

/** 给指定园区的 timeline 字段做 update（找不到则新建一条） */
function updateTimelineForYard(
  d: Dispatch,
  yardId: string,
  updater: (y: YardTimeline) => YardTimeline,
): YardTimeline[] {
  const existing = d.yardTimelines.find((y) => y.yardId === yardId)
  if (existing) {
    return d.yardTimelines.map((y) => (y.yardId === yardId ? updater(y) : y))
  }
  return [...d.yardTimelines, updater({ yardId })]
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
  save: async (dispatch, opts) => {
    // 业务层调用时不传 opts → 尊重传入的 status（修复之前强制 derive 覆盖 confirmed/cancelled 等 bug）
    // markXxx 内部传 { autoDerive: true } → 仍按 timeline 自动转 status
    const autoDerive = opts?.autoDerive ?? false
    const next = autoDerive
      ? { ...dispatch, status: deriveStatus(dispatch) }
      : dispatch
    const updated = withDerived(next)
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
    await get().save(updated, { autoDerive: true })
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
    await get().save(updated, { autoDerive: true })
  },

  /**
   * M2.2 v2:车辆 GPS 检测到园区时,统一走 queued 状态
   *  - 不再直接 entering（必须库房员通知入场 + 道闸放行）
   *  - 同时写入 arrivedByGpsAt 作为 GPS 检测时间记录（不再驱动状态机）
   */
  markYardQueuedByGps: async (vehicleId, yardId, queuedAt) => {
    // 反查：派车后（dispatched / queued）的调度单
    const d = get().list.find(
      (x) =>
        x.vehicleId === vehicleId &&
        (x.status === 'dispatched' || x.status === 'queued' || x.status === 'entering' || x.status === 'loading') &&
        x.yardTimelines.some((y) => y.yardId === yardId),
    )
    if (!d) {
      console.warn(`[dispatch] GPS 检测未匹配：vehicleId=${vehicleId} yardId=${yardId}`)
      return
    }
    // 用 updateTimelineForYard 统一处理(幂等)
    const tl = updateTimelineForYard(d, yardId, (y) => ({
      ...y,
      queuedAt: y.queuedAt ?? queuedAt,
      arrivedByGpsAt: y.arrivedByGpsAt ?? queuedAt,
    }))
    const updated: Dispatch = { ...d, yardTimelines: tl }
    await get().save(updated, { autoDerive: true })
  },

  /**
   * M2.2 v2:司机扫码排队（无 GPS 场景）
   *  - 司机在 H5 点【扫码排队】按钮触发
   *  - 与 GPS 自动检测等价(只记录 queuedAt)
   */
  markYardQueuedByScan: async (dispatchId, yardId, queuedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 用 updateTimelineForYard 统一处理(幂等)
    const tl = updateTimelineForYard(d, yardId, (y) => ({
      ...y,
      queuedAt: y.queuedAt ?? queuedAt,
    }))
    const updated: Dispatch = { ...d, yardTimelines: tl }
    await get().save(updated, { autoDerive: true })
  },

  /**
   * M2.2 v2:库房员通知入场 + 道闸开闸（queued → entering）
   *  - 库房员在前端点【通知入场】按钮触发
   *  - 实际生产: 调用道闸 API；mock 阶段: 由 UI setTimeout 模拟 3 秒后自动调用
   *  - 写入 notifyDepartAt(库房员通知时间) + enteredAt(道闸开闸时间 = 实际入园时间)
   */
  triggerGateOpen: async (dispatchId, yardId, enteredAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 状态守卫:仅 queued 状态可通知入场
    if (d.status !== 'queued') {
      throw new Error(`当前状态「${d.status}」不允许通知入场（需先进入 queued 状态）`)
    }
    const tl = updateTimelineForYard(d, yardId, (y) => ({
      ...y,
      enteredAt: y.enteredAt ?? enteredAt,
      enteredVia: 'manual' as const, // 道闸放行视为人工放行（M2.2 v2:不再依赖 GPS）
      notifyDepartAt: y.notifyDepartAt ?? enteredAt,
    }))
    const updated: Dispatch = { ...d, yardTimelines: tl }
    await get().save(updated, { autoDerive: true })
  },

  /**
   * M2.2 v2:司机确认完成（链式触发 completed）
   *  - 给所有园区补齐 driverConfirmedAt(若无),设置 dispatch.completedAt
   *  - 由 confirmArrivalByDriver 自动链式调用
   */
  completeByDriverConfirm: async (dispatchId) => {
    const now = nowIsoString()
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const tl = d.yardTimelines.map((y) => ({
      ...y,
      driverConfirmedAt: y.driverConfirmedAt ?? now,
    }))
    const updated: Dispatch = {
      ...d,
      yardTimelines: tl,
      completedAt: now,
    }
    await get().save(updated, { autoDerive: true })
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
    await get().save(updated, { autoDerive: true })
  },

  // ====== 旧扫码 stub 已下线（M3 GPS 自动打卡替代）======

  /**
   * 标记装货完成（库房员点击"装货完成"按钮触发）
   * @param dispatchId 调车单 ID
   * @param yardId 当前激活园区 ID
   * @param completedAt 装货完成时间（ISO 字符串）
   * @param overtime 超时备注（2026-07-20 新增；全手填）
   *   - reason：超时原因（手填文本，单字符串）
   *   - department：超时责任部门（手填文本，单字符串）
   *   - ownerName：负责人姓名（手填文本）
   */
  markLoadingCompleted: async (
    dispatchId,
    yardId,
    completedAt,
    overtime?: { reason?: string; department?: string; ownerName?: string },
  ) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) => {
        if (y.yardId !== yardId) return y
        return {
          ...y,
          loadingCompletedAt: completedAt,
          overtimeReason: overtime?.reason?.trim() || y.overtimeReason,
          overtimeDepartment: overtime?.department?.trim() || y.overtimeDepartment,
          overtimeOwnerName: overtime?.ownerName?.trim() || y.overtimeOwnerName,
        }
      }),
    }
    await get().save(updated, { autoDerive: true })
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
    await get().save(updated, { autoDerive: true })
  },

  /** GPS 入客户园区（mock：来自位置流 tick，自动反查 dispatch）
   *  M2.2 v2:仅写入 arrivedByGpsAt 字段(供后续分析),不再驱动状态机
   */
  markArrivedByGps: async (vehicleId, arrivedAt) => {
    const d = get().list.find(
      (x) =>
        x.vehicleId === vehicleId &&
        (x.status === 'in_transit' || x.status === 'driver_confirmed') &&
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
    await get().save(updated, { autoDerive: true })
  },

  /** 司机手动确认到达（M2.2 v2：链式触发 completeByDriverConfirm → completed） */
  confirmArrivalByDriver: async (dispatchId, confirmedAt) => {
    const d = get().list.find((x) => x.id === dispatchId)
    if (!d) throw new Error('调车单不存在')
    // 1. 写 driverConfirmedAt
    const updated: Dispatch = {
      ...d,
      yardTimelines: d.yardTimelines.map((y) =>
        !y.driverConfirmedAt ? { ...y, driverConfirmedAt: confirmedAt } : y,
      ),
    }
    await get().save(updated, { autoDerive: true })
    // 2. 链式触发 completed
    await get().completeByDriverConfirm(dispatchId)
  },

  // ❌ v0.3.0-M2.2 删除:signByCustomer / generateSignUrl（客户签收全链路已下线）
}))
