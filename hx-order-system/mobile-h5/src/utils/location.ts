/**
 * H5 端定位工具（M3 阶段：GPS 入园 / 离厂）
 *
 * 注意：mock 阶段车辆位置由 PC 端 gpsStream 管理，H5 自身定位仅用于：
 *  - 司机侧"切换司机"后展示当前定位
 *  - 未来真实生产中作为 H5 端"补位定位"（硬件 GPS 失效时）
 */

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
