/**
 * Mock 阶段「车辆硬件 GPS」位置流引擎
 *
 * 真实生产：替换为 JT/T 808 / 808-2013 协议位置上报服务（部标机 / 北斗）。
 * mock 阶段：浏览器内定时 tick 推进每辆启用车辆的经纬度。
 *
 * 数据契约：
 *  - 订阅：subscribeGps(fn) → unsubscribe
 *  - 瞬移演示：teleportVehicle(id, mode)
 *  - 园区入园判定：inYard = 任一 yard center 距离 ≤ enterRadiusM
 *
 * 持久化：localStorage['HX_GPS_STATE']
 */

import { mockVehicles, mockYards } from './seed'
import { mockDB } from './db'

export interface GpsPing {
  vehicleId: string
  plateNo: string
  lng: number
  lat: number
  speed: number          // km/h
  direction: number      // 0-360°
  /** 距离最近园区的米数（缓存，订阅时可读） */
  distanceToYardM?: number
  /** 是否在任一园区半径内 */
  inYard?: { yardId: string; yardName: string; distanceM: number }
  updatedAt: string      // ISO
}

const STORAGE_KEY = 'HX_GPS_STATE'

/** Haversine 距离（米） */
function distanceM(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 在 1° 范围内 1°lng ≈ 111km * cos(lat) — 用于 tick 推进 */
function stepMeters(pos: { lng: number; lat: number }, directionDeg: number, meters: number) {
  const rad = (directionDeg * Math.PI) / 180
  // 1° lat ≈ 111000m
  pos.lat += (meters * Math.cos(rad)) / 111000
  pos.lng += (meters * Math.sin(rad)) / (111000 * Math.cos((pos.lat * Math.PI) / 180))
}

let state: GpsPing[] = []
let timer: number | null = null
let prevInYard: Record<string, boolean> = {}
let prevYardId: Record<string, string> = {}
const listeners = new Set<(pings: GpsPing[]) => void>()

function loadState() {
  return state
}

function saveState(next: GpsPing[]) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage 不可用（SSR/隐私模式）时降级
  }
}

/** 初始化：每辆启用车辆分配一个起点（园区 1-5km 沿不同方向） */
function initIfEmpty() {
  if (state.length > 0) return
  // 尝试从 localStorage 恢复
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GpsPing[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        state = parsed
        return
      }
    }
  } catch {
    // 继续初始化
  }

  const enabled = mockVehicles.filter((v) => v.status === 'enabled')
  const baseYard = mockYards[0]
  state = enabled.map((v, idx) => {
    // 2 辆停在门口 50m（已入园），3 辆在 1-5km 外
    if (idx < 2) {
      return {
        vehicleId: v.id,
        plateNo: v.plateNo,
        lng: baseYard.centerLng! + 0.0005 * (idx === 0 ? 1 : -1),
        lat: baseYard.centerLat! + 0.0005 * (idx === 0 ? 1 : -1),
        speed: 0,
        direction: 0,
        inYard: { yardId: baseYard.id, yardName: baseYard.name, distanceM: 50 },
        distanceToYardM: 50,
        updatedAt: new Date().toISOString(),
      }
    }
    // 距园区 1-5km
    const offset = 0.01 + Math.random() * 0.04
    const dir = Math.random() * 360
    return {
      vehicleId: v.id,
      plateNo: v.plateNo,
      lng: baseYard.centerLng! + offset * Math.cos((dir * Math.PI) / 180),
      lat: baseYard.centerLat! + offset * Math.sin((dir * Math.PI) / 180),
      speed: 30 + Math.floor(Math.random() * 50),
      direction: Math.floor(dir),
      updatedAt: new Date().toISOString(),
    }
  })
  saveState(state)
  prevInYard = Object.fromEntries(state.map((p) => [p.vehicleId, !!p.inYard]))
  prevYardId = Object.fromEntries(
    state.filter((p) => p.inYard).map((p) => [p.vehicleId, p.inYard!.yardId]),
  )
}

/** 单次 tick：每辆车按 speed 推进，判定入园/离厂 */
function tick() {
  const intervalSec = 5
  const yards = mockYards.filter((y) => y.centerLng != null && y.centerLat != null)

  state = state.map((p) => {
    let next: GpsPing = { ...p }
    if (next.speed > 0) {
      stepMeters(next, next.direction, (next.speed * 1000) / 3600 * intervalSec)
    }
    // 判定入园
    let nearest: { yard: typeof yards[number]; dist: number } | null = null
    for (const y of yards) {
      const d = distanceM(next, { lng: y.centerLng!, lat: y.centerLat! })
      if (!nearest || d < nearest.dist) nearest = { yard: y, dist: d }
    }
    next.distanceToYardM = nearest?.dist
    if (nearest && nearest.dist <= (nearest.yard.enterRadiusM ?? 300)) {
      next.inYard = { yardId: nearest.yard.id, yardName: nearest.yard.name, distanceM: nearest.dist }
    } else {
      next.inYard = undefined
    }
    next.updatedAt = new Date().toISOString()
    return next
  })

  saveState(state)
  listeners.forEach((fn) => fn(state))
}

/** 启动位置流（仅在浏览器环境） */
export function startGpsStream(intervalMs = 5000): void {
  if (typeof window === 'undefined') return
  if (timer) return
  initIfEmpty()
  // 立即触发一次订阅回调（让 UI 拿到初始 pings）
  listeners.forEach((fn) => fn(state))
  timer = window.setInterval(tick, intervalMs)
}

export function stopGpsStream(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function subscribeGps(fn: (pings: GpsPing[]) => void): () => void {
  listeners.add(fn)
  // 立即推一次（订阅即用）
  if (state.length > 0) fn(state)
  return () => {
    listeners.delete(fn)
  }
}

export function getCurrentPings(): GpsPing[] {
  return state
}

/**
 * 演示用：手动把指定车辆「瞬移」到目标位置
 * - 'enter'   : 移到第 1 园区门口（GPS 触发入园）
 * - 'leave'   : 移到园区外 1km（GPS 触发离厂）
 * - 'enroute' : 移到距园区 2km、speed 80（运输中）
 * - 'far'     : 移到距园区 5km、speed 0（已收车）
 */
export function teleportVehicle(
  vehicleId: string,
  mode: 'enter' | 'leave' | 'enroute' | 'far',
): void {
  const target = state.find((p) => p.vehicleId === vehicleId)
  if (!target) return
  const yard = mockYards[0]
  let next: GpsPing
  switch (mode) {
    case 'enter':
      next = {
        ...target,
        lng: yard.centerLng!,
        lat: yard.centerLat!,
        speed: 0,
        direction: 0,
        inYard: { yardId: yard.id, yardName: yard.name, distanceM: 0 },
        distanceToYardM: 0,
        updatedAt: new Date().toISOString(),
      }
      break
    case 'leave':
      next = {
        ...target,
        lng: yard.centerLng! + 0.01,
        lat: yard.centerLat! + 0.01,
        speed: 60,
        direction: 90,
        inYard: undefined,
        distanceToYardM: 1500,
        updatedAt: new Date().toISOString(),
      }
      break
    case 'enroute':
      next = {
        ...target,
        lng: yard.centerLng! + 0.02,
        lat: yard.centerLat!,
        speed: 80,
        direction: 270,
        inYard: undefined,
        distanceToYardM: 2200,
        updatedAt: new Date().toISOString(),
      }
      break
    case 'far':
    default:
      next = {
        ...target,
        lng: yard.centerLng! + 0.05,
        lat: yard.centerLat!,
        speed: 0,
        direction: 0,
        inYard: undefined,
        distanceToYardM: 5500,
        updatedAt: new Date().toISOString(),
      }
  }
  state = state.map((p) => (p.vehicleId === vehicleId ? next : p))
  saveState(state)
  listeners.forEach((fn) => fn(state))
}

/** 重置位置流（演示用） */
export function resetGpsStream(): void {
  state = []
  prevInYard = {}
  prevYardId = {}
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略
  }
  initIfEmpty()
  listeners.forEach((fn) => fn(state))
}

/** 异步获取最近一次 pings（兼容旧代码按需拉取） */
export async function fetchCurrentPings(): Promise<GpsPing[]> {
  await mockDB.listDispatches() // 占位：触发 mockDB 初始化
  if (state.length === 0) initIfEmpty()
  return state
}
