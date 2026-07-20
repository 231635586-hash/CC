/**
 * GPS 单例轮询器（P0-2 GPS 自动到货用）
 *
 * Why this exists：
 *   - H5 端需要周期性检查司机是否到达客户地址附近（≤200m 自动触发 arrived）
 *   - 浏览器 Geolocation API 无 watch 接口，需自己用 setInterval 实现
 *   - 多条 in_transit 派车单共享一个 watcher，避免重复启动定时器
 *
 * 设计原则：
 *   - 单例：全应用只允许 1 个 watcher 实例
 *   - 多目标：onTick 回调一次处理多条派车单
 *   - 后台节流：visibilitychange 监听，回到前台立即补一次 tick
 *   - 兜底：getCurrentPosition 失败不抛错，吞掉并继续下一轮
 *
 * How to use：
 *   - startGpsWatcher({ onTick, intervalMs }) 启动
 *   - stopGpsWatcher() 停止
 *   - isGpsWatcherRunning() 查询状态
 *
 * v0.3.0-M2.2 + P0-2：初版（仅 1 个 target 的简化版，后续如需多 target 升级）
 */

import { getCurrentPosition, type Position } from './location'

export interface GpsWatcherOptions {
  /** 每轮回调；返回 Promise 可异步处理；watcher 不等待 onTick 完成 */
  onTick: (position: Position) => void | Promise<void>
  /** 轮询周期（毫秒），默认 30s */
  intervalMs?: number
  /** 是否立即执行一次（默认 true） */
  immediate?: boolean
}

interface WatcherState {
  timer: ReturnType<typeof setInterval> | null
  visibilityListener: (() => void) | null
  running: boolean
  opts: GpsWatcherOptions | null
}

const state: WatcherState = {
  timer: null,
  visibilityListener: null,
  running: false,
  opts: null,
}

/**
 * 启动 watcher（单例）
 *
 * 若已运行则更新 opts（新的 onTick 生效），但保留原 intervalMs
 * 若未运行则启动定时器 + visibilitychange 监听
 */
export function startGpsWatcher(opts: GpsWatcherOptions): void {
  const intervalMs = opts.intervalMs ?? 30000
  state.opts = opts

  if (state.running) {
    // 已运行：更新 opts（让新回调生效），不重启定时器
    return
  }

  state.running = true

  const tick = async () => {
    if (!state.opts) return
    try {
      const pos = await getCurrentPosition()
      await state.opts.onTick(pos)
    } catch (e) {
      // 吞错：单次失败不应中断 watcher（兜底坐标由 getCurrentPosition 内部处理）
      console.warn('[gpsWatcher] tick failed', e)
    }
  }

  // 立即执行一次（immediate 默认为 true）
  if (opts.immediate !== false) {
    void tick()
  }

  // 启动定时器
  state.timer = setInterval(tick, intervalMs)

  // 后台节流：visibilitychange 回到前台立即补一次 tick
  state.visibilityListener = () => {
    if (document.visibilityState === 'visible' && state.running) {
      void tick()
    }
  }
  document.addEventListener('visibilitychange', state.visibilityListener)
}

/** 停止 watcher */
export function stopGpsWatcher(): void {
  if (!state.running) return
  state.running = false
  if (state.timer) {
    clearInterval(state.timer)
    state.timer = null
  }
  if (state.visibilityListener) {
    document.removeEventListener('visibilitychange', state.visibilityListener)
    state.visibilityListener = null
  }
  state.opts = null
}

/** 查询 watcher 是否在运行 */
export function isGpsWatcherRunning(): boolean {
  return state.running
}