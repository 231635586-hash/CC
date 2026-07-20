/**
 * H5 端定位工具（M3 阶段：GPS 入园 / 离厂）
 *
 * 注意：mock 阶段车辆位置由 PC 端 gpsStream 管理，H5 自身定位仅用于：
 *  - 司机侧"切换司机"后展示当前定位
 *  - 未来真实生产中作为 H5 端"补位定位"（硬件 GPS 失效时）
 *
 * v0.3.0-M2.2 + P0-2：
 *   - 新增 detectCustomerAddress / CUSTOMER_RADIUS_M
 *   - 用于司机到达客户地址附近时自动触发 arrived 状态
 */

import type { CustomerSite } from '@/types/shared/dispatch'

export interface YardLite {
  id: string
  name: string
  lng: number
  lat: number
  radiusM?: number
}

export interface Position {
  lng: number
  lat: number
  /** 精度（米） */
  accuracyM?: number
}

/**
 * 客户收货点触发半径（米）— P0-2 GPS 自动到货用
 *
 * Why 200m：与 Web 端 Customer.site.radiusM 默认值对齐
 *          200m 既能容忍 GPS 误差（accuracy 通常 ≤50m），又不会过早触发
 */
export const CUSTOMER_RADIUS_M = 200

/**
 * 园区触发半径（米）— P0-5 GPS 自动入园提示用
 *
 * Why 300m：与 Yard.radiusM 默认值对齐（mock 园区都是 300m 半径）
 *          300m 让司机有足够缓冲时间准备扫码
 */
export const YARD_RADIUS_M = 300

/** Haversine 距离（米） */
export function distanceM(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 检测当前点是否在任一园区半径内 */
export function detectYard(p: Position, yards: YardLite[]): YardLite | null {
  let best: { yard: YardLite; dist: number } | null = null
  for (const y of yards) {
    const d = distanceM(p, { lng: y.lng, lat: y.lat })
    if (!best || d < best.dist) best = { yard: y, dist: d }
  }
  if (best && best.dist <= (best.yard.radiusM ?? 300)) return best.yard
  return null
}

/**
 * 检测当前点是否在客户收货点半径内（P0-2 GPS 自动到货用）
 *
 * @returns true 表示已到达客户地址附近
 *
 * 与 detectYard 的区别：
 *   - detectYard 处理多园区，返回最近园区对象
 *   - detectCustomerAddress 处理单个客户收货点，返回布尔
 */
export function detectCustomerAddress(p: Position, site: CustomerSite): boolean {
  const radius = site.radiusM ?? CUSTOMER_RADIUS_M
  return distanceM(p, { lng: site.lng, lat: site.lat }) <= radius
}

/**
 * uni-app H5 端获取位置（mock 阶段走 fallback；真实阶段用 uni.getLocation）
 * 失败兜底：返回秦壁园区中心（111.513, 36.081）
 */
export async function getCurrentPosition(): Promise<Position> {
  try {
    // 真实环境（uni-app H5）走 navigator.geolocation
    // mock 阶段用 setTimeout 模拟定位结果
    if (typeof uni !== 'undefined' && typeof uni.getLocation === 'function') {
      return await new Promise<Position>((resolve, reject) => {
        uni.getLocation({
          type: 'wgs84',
          success: (res: { longitude: number; latitude: number; accuracy?: number }) =>
            resolve({ lng: res.longitude, lat: res.latitude, accuracyM: res.accuracy }),
          fail: (err: unknown) => reject(err),
        })
      })
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return await new Promise<Position>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lng: pos.coords.longitude,
              lat: pos.coords.latitude,
              accuracyM: pos.coords.accuracy,
            }),
          (err) => reject(err),
        )
      })
    }
    throw new Error('no geolocation api')
  } catch (e) {
    // 兜底：秦壁园区中心
    console.warn('[location] getCurrentPosition failed, using fallback', e)
    return { lng: 111.513, lat: 36.081, accuracyM: 100 }
  }
}
