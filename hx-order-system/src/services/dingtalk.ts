/**
 * 钉钉推送服务（M2 mock 阶段）
 *
 * 真实推送待后端联调；当前阶段：
 * 1. 解析调车单所属园区的 factory 群机器人
 * 2. 用 ${varName} 模板渲染消息内容
 * 3. console.log 模拟推送
 * 4. 写入 pushLogs 表（M2 mock 阶段供"推送日志"页面回放）
 */

import { mockDB } from '@/mock/db'
import { genId, nowIsoString } from '@/utils'
import type { DingtalkBot, PushLog } from '@/types/system'
import type { Dispatch } from '@/types/dispatch'
import type { Driver } from '@/types/archives'

/** 模板变量替换（${varName} → 实际值） */
function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

/** 解析某园区已启用的 factory 群机器人 */
export async function resolveFactoryBot(yardId: string): Promise<DingtalkBot | undefined> {
  const bots = await mockDB.listDingtalkBots()
  return bots.find(
    (b) => b.status === 'enabled' && b.groupType === 'factory' && b.yardId === yardId,
  )
}

/** 推送"新排队登记"消息（M2 阶段 1：司机扫码登记 → 库房钉钉群） */
export async function pushQueueRegistration(args: {
  dispatch: Dispatch
  driver?: Driver | null
  yardId: string
  scanUrl: string
}): Promise<PushLog | null> {
  const templates = await mockDB.listDingtalkTemplates()
  const template = templates.find((t) => t.code === 'QUEUE_REGISTER')
  if (!template) {
    console.warn('[dingtalk:mock] QUEUE_REGISTER 模板未配置')
    return null
  }
  const bot = await resolveFactoryBot(args.yardId)
  if (!bot) {
    console.warn(`[dingtalk:mock] 园区 ${args.yardId} 未配置 factory 群机器人`)
    return null
  }
  const yards = await mockDB.listYards()
  const yard = yards.find((y) => y.id === args.yardId)

  // 计算该园区当前排队序号
  const allDispatches = await mockDB.listDispatches()
  const queuePos = allDispatches.filter(
    (d) =>
      ['dispatched', 'entering'].includes(d.status) &&
      d.yardTimelines?.some(
        (y) => y.yardId === args.yardId && !y.leftAt && y.enteredAt,
      ),
  ).length + 1

  const vars: Record<string, string> = {
    dispatchNo: args.dispatch.dispatchNo,
    plateNo: args.dispatch.vehicleNo || '-',
    driverName: args.driver?.name || args.dispatch.driverName || '-',
    driverPhone: args.driver?.phone || '-',
    yardName: yard?.name || '-',
    registerTime: nowIsoString(),
    queuePosition: String(queuePos),
    scanUrl: args.scanUrl,
  }
  const content = renderTemplate(template.content, vars)

  // M2 mock：实际推送（控制台 + pushLog 表）
  console.log(`[dingtalk:mock] 推送至 ${bot.name}：\n${content}`)

  const log: PushLog = {
    id: genId('push'),
    botId: bot.id,
    botName: bot.name,
    templateCode: template.code,
    content,
    recipient: bot.name,
    relatedDispatchId: args.dispatch.id,
    createdAt: nowIsoString(),
  }
  await mockDB.savePushLog(log)
  return log
}

/**
 * 推送"通知出发"消息（M3 阶段：库房"通知出发"按钮 → 调度群）
 *
 * 模板 code：DEPART_NOTIFY
 * 与 pushQueueRegistration 共享 factory 群机器人
 */
export async function pushDepartNotify(args: {
  dispatch: Dispatch
  yardId: string
}): Promise<PushLog | null> {
  const templates = await mockDB.listDingtalkTemplates()
  const template =
    templates.find((t) => t.code === 'DEPART_NOTIFY') ??
    // 兼容：模板未配置时用兜底内容
    null
  const yard = (await mockDB.listYards()).find((y) => y.id === args.yardId)
  const vars: Record<string, string> = {
    dispatchNo: args.dispatch.dispatchNo,
    plateNo: args.dispatch.vehicleNo || '-',
    driverName: args.dispatch.driverName || '-',
    yardName: yard?.name || '-',
    departTime: nowIsoString(),
  }
  const content = template
    ? renderTemplate(template.content, vars)
    : `【通知出发】\n调车单：${vars.dispatchNo}\n车辆：${vars.plateNo}\n司机：${vars.driverName}\n园区：${vars.yardName}\n时间：${vars.departTime}\n请司机尽快出发！`

  const bot = await resolveFactoryBot(args.yardId)
  if (!bot) {
    console.warn(`[dingtalk:mock] 园区 ${args.yardId} 未配置 factory 群机器人，跳过推送`)
  } else {
    console.log(`[dingtalk:mock] 推送至 ${bot.name}：\n${content}`)
  }
  const log: PushLog = {
    id: genId('push'),
    botId: bot?.id ?? 'mock',
    botName: bot?.name ?? 'MOCK',
    templateCode: 'DEPART_NOTIFY',
    content,
    recipient: bot?.name ?? 'MOCK',
    relatedDispatchId: args.dispatch.id,
    createdAt: nowIsoString(),
  }
  await mockDB.savePushLog(log)
  return log
}

/**
 * 推送"通知装货"消息（M3 阶段：库房"通知装货"按钮 → 司机 H5 消息中心）
 *
 * 模板 code：LOADING_NOTIFY
 */
export async function pushLoadingNotify(args: {
  dispatch: Dispatch
  yardId: string
}): Promise<PushLog | null> {
  const templates = await mockDB.listDingtalkTemplates()
  const template = templates.find((t) => t.code === 'LOADING_NOTIFY') ?? null
  const yard = (await mockDB.listYards()).find((y) => y.id === args.yardId)
  const vars: Record<string, string> = {
    dispatchNo: args.dispatch.dispatchNo,
    plateNo: args.dispatch.vehicleNo || '-',
    driverName: args.dispatch.driverName || '-',
    yardName: yard?.name || '-',
    loadingTime: nowIsoString(),
  }
  const content = template
    ? renderTemplate(template.content, vars)
    : `【通知装货】\n调车单：${vars.dispatchNo}\n车辆：${vars.plateNo}\n司机：${vars.driverName}\n请到 ${vars.yardName} 园区装货！\n时间：${vars.loadingTime}`

  const bot = await resolveFactoryBot(args.yardId)
  if (!bot) {
    console.warn(`[dingtalk:mock] 园区 ${args.yardId} 未配置 factory 群机器人，跳过推送`)
  } else {
    console.log(`[dingtalk:mock] 推送至 ${bot.name}：\n${content}`)
  }
  const log: PushLog = {
    id: genId('push'),
    botId: bot?.id ?? 'mock',
    botName: bot?.name ?? 'MOCK',
    templateCode: 'LOADING_NOTIFY',
    content,
    recipient: bot?.name ?? 'MOCK',
    relatedDispatchId: args.dispatch.id,
    createdAt: nowIsoString(),
  }
  await mockDB.savePushLog(log)
  return log
}