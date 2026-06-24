import dayjs from 'dayjs'
import type { Dispatch, ShippingMethod, TruckSize } from '@/types/dispatch'
import { BIG_TRUCK_SIZES } from '@/types/dispatch'

/** 校验结果 */
export interface ValidationResult {
  valid: boolean
  reason?: string
}

/** 校验上下文 */
export interface RuleContext {
  shippingMethod: ShippingMethod
  truckSize?: TruckSize
  expectedLoadTime: string
  isUrgent: boolean
}

/** 是否需要选车型 */
export function needTruckSize(sm: ShippingMethod | undefined): boolean {
  return sm === 'big_truck' || sm === 'small_truck'
}

/** 根据发运方式过滤可选车型 */
export function getAvailableTruckSizes(sm: ShippingMethod | undefined): TruckSize[] {
  if (sm === 'big_truck') return BIG_TRUCK_SIZES
  if (sm === 'small_truck') return ['4.2m', '6.8m']
  return []
}

/** 发运方式 ↔ 车型联动校验 */
export function validateShippingMethod(ctx: RuleContext): ValidationResult {
  const need = needTruckSize(ctx.shippingMethod)
  if (need && !ctx.truckSize) {
    return { valid: false, reason: '该发运方式（大车/小车）必须选择车型' }
  }
  if (ctx.truckSize) {
    if (ctx.shippingMethod === 'big_truck' && !BIG_TRUCK_SIZES.includes(ctx.truckSize)) {
      return { valid: false, reason: '大车仅支持 13 米 / 13.75 米 / 17.5 米' }
    }
    if (
      ctx.shippingMethod === 'small_truck' &&
      !(['4.2m', '6.8m'] as TruckSize[]).includes(ctx.truckSize)
    ) {
      return { valid: false, reason: '小车仅支持 4.2 米 / 6.8 米' }
    }
  }
  return { valid: true }
}

/** 大车：每小时内最多 2 辆（紧急调车 + 已完成的不计入） */
export function validateBigTruckHourLimit(
  ctx: RuleContext,
  existingDispatches: Dispatch[],
  excludeId?: string,
): ValidationResult {
  if (ctx.isUrgent) return { valid: true }
  if (ctx.shippingMethod !== 'big_truck' || !ctx.truckSize) return { valid: true }

  const target = dayjs(ctx.expectedLoadTime)
  if (!target.isValid()) return { valid: true }
  const hourKey = target.format('YYYY-MM-DD HH')

  const same = existingDispatches.filter((d) => {
    if (excludeId && d.id === excludeId) return false
    if (d.shippingMethod !== 'big_truck') return false
    if (d.isUrgent) return false
    // 排除已完成的
    if (d.status === 'completed' || d.status === 'cancelled') return false
    return dayjs(d.expectedLoadTime).format('YYYY-MM-DD HH') === hourKey
  })
  if (same.length >= 2) {
    return {
      valid: false,
      reason: `本时间段（${hourKey}:00）已安排 ${same.length} 辆大车，超过上限 2 辆`,
    }
  }
  return { valid: true }
}

/** 大车时间窗：12 点前操作→8 小时后；12 点后操作→次日 13:30 后 */
export function validateBigTruckTimeWindow(
  ctx: RuleContext,
  now: Date = new Date(),
): ValidationResult {
  if (ctx.isUrgent) return { valid: true }
  if (ctx.shippingMethod !== 'big_truck' || !ctx.truckSize) return { valid: true }

  const op = dayjs(now)
  const target = dayjs(ctx.expectedLoadTime)
  if (!target.isValid()) return { valid: true }

  const opHour = op.hour()
  if (opHour < 12) {
    const earliest = op.add(8, 'hour')
    if (target.isBefore(earliest)) {
      return {
        valid: false,
        reason: `12 点前操作大车，期望装货时间需在 ${earliest.format('HH:mm')} 之后`,
      }
    }
  } else {
    const nextDay1330 = op.add(1, 'day').hour(13).minute(30).second(0)
    if (target.isBefore(nextDay1330)) {
      return {
        valid: false,
        reason: '12 点后操作大车，期望装货时间需在次日 13:30 之后',
      }
    }
  }
  return { valid: true }
}

/** 小车时间窗：8:00-12:00 操作→5 小时后；12 点后操作→8 小时后 */
export function validateSmallTruckTimeWindow(
  ctx: RuleContext,
  now: Date = new Date(),
): ValidationResult {
  if (ctx.isUrgent) return { valid: true }
  if (ctx.shippingMethod !== 'small_truck' || !ctx.truckSize) return { valid: true }

  const op = dayjs(now)
  const target = dayjs(ctx.expectedLoadTime)
  if (!target.isValid()) return { valid: true }

  const opHour = op.hour()
  if (opHour >= 8 && opHour < 12) {
    const earliest = op.add(5, 'hour')
    if (target.isBefore(earliest)) {
      return {
        valid: false,
        reason: `8:00-12:00 操作小车，期望装货时间需在 ${earliest.format('HH:mm')} 之后`,
      }
    }
  } else if (opHour >= 12) {
    const earliest = op.add(8, 'hour')
    if (target.isBefore(earliest)) {
      return {
        valid: false,
        reason: `12 点后操作小车，期望装货时间需在 ${earliest.format('HH:mm')} 之后`,
      }
    }
  }
  return { valid: true }
}

/** 综合校验 */
export function validateDispatch(
  ctx: RuleContext,
  existingDispatches: Dispatch[],
  excludeId?: string,
): ValidationResult {
  const checks: ValidationResult[] = [
    validateShippingMethod(ctx),
    validateBigTruckHourLimit(ctx, existingDispatches, excludeId),
    validateBigTruckTimeWindow(ctx),
    validateSmallTruckTimeWindow(ctx),
  ]
  const failed = checks.find((r) => !r.valid)
  return failed || { valid: true }
}