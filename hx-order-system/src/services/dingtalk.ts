/**
 * 钉钉推送服务（M2 mock 阶段）
 *
 * 真实推送待后端联调；当前阶段：
 * 1. 解析调车单所属园区的 factory 群机器人
 * 2. 用 ${varName} 模板渲染消息内容
 * 3. console.log 模拟推送
 * 4. 写入 pushLogs 表（M2 mock 阶段供"推送日志"页面回放）
 *
 * 公共实现：pushByTemplate（5 个业务函数共享同一份模板 + 推送 + 日志流程）
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

/**
 * 通用推送（M2 mock 阶段）
 *
 * 业务函数（pushQueueRegistration / pushDepartNotify / ...）均通过本函数
 * 完成模板解析 + console.log + savePushLog 三步，自身只负责组装 vars 和兜底文案。
 */
async function pushByTemplate(args: {
  templateCode: string
  /** 模板未配置时的兜底文案（必须含 ${vars}） */
  fallbackContent: string
  vars: Record<string, string>
  /** 可选：覆盖默认 bot 解析（不传则按 yardId 查 factory bot） */
  yardId?: string
  /** 可选：自定义 recipient（默认用 bot.name） */
  recipient?: string
  /** 可选：自定义 botId / botName（兜底场景，无 bot 时用 'mock'） */
  botId?: string
  botName?: string
  dispatchId: string
}): Promise<PushLog | null> {
  const templates = await mockDB.listDingtalkTemplates()
  const template = templates.find((t) => t.code === args.templateCode) ?? null
  const content = template
    ? renderTemplate(template.content, args.vars)
    : renderTemplate(args.fallbackContent, args.vars)

  let bot: DingtalkBot | undefined
  if (args.yardId) {
    bot = await resolveFactoryBot(args.yardId)
    if (!bot) {
      console.warn(`[dingtalk:mock] 园区 ${args.yardId} 未配置 factory 群机器人，跳过推送`)
    }
  }
  console.log(`[dingtalk:mock] 推送至 ${bot?.name ?? args.botName ?? 'MOCK'}：\n${content}`)

  const log: PushLog = {
    id: genId('push'),
    botId: bot?.id ?? args.botId ?? 'mock',
    botName: bot?.name ?? args.botName ?? 'MOCK',
    templateCode: args.templateCode,
    content,
    recipient: args.recipient ?? bot?.name ?? args.botName ?? 'MOCK',
    relatedDispatchId: args.dispatchId,
    createdAt: nowIsoString(),
  }
  await mockDB.savePushLog(log)
  return log
}

/** 推送"新排队登记"消息（M2 阶段 1：司机扫码登记 → 库房钉钉群） */
export async function pushQueueRegistration(args: {
  dispatch: Dispatch
  driver?: Driver | null
  yardId: string
  scanUrl: string
}): Promise<PushLog | null> {
  const yard = (await mockDB.listYards()).find((y) => y.id === args.yardId)

  // 计算该园区当前排队序号
  const allDispatches = await mockDB.listDispatches()
  const queuePos = allDispatches.filter(
    (d) =>
      ['dispatched', 'entering'].includes(d.status) &&
      d.yardTimelines?.some(
        (y) => y.yardId === args.yardId && !y.leftAt && y.enteredAt,
      ),
  ).length + 1

  return pushByTemplate({
    templateCode: 'QUEUE_REGISTER',
    fallbackContent: '【新排队登记】\n调车单：${dispatchNo}\n车牌：${plateNo}\n司机：${driverName}\n园区：${yardName}\n排队序号：${queuePosition}',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.driver?.name || args.dispatch.driverName || '-',
      driverPhone: args.driver?.phone || '-',
      yardName: yard?.name || '-',
      registerTime: nowIsoString(),
      queuePosition: String(queuePos),
      scanUrl: args.scanUrl,
    },
    yardId: args.yardId,
    dispatchId: args.dispatch.id,
  })
}

/**
 * 推送"通知出发"消息（M3 阶段：库房"通知出发"按钮 → 调度群）
 *
 * 模板 code：DEPART_NOTIFY
 */
export async function pushDepartNotify(args: {
  dispatch: Dispatch
  yardId: string
}): Promise<PushLog | null> {
  const yard = (await mockDB.listYards()).find((y) => y.id === args.yardId)
  return pushByTemplate({
    templateCode: 'DEPART_NOTIFY',
    fallbackContent:
      '【通知出发】\n调车单：${dispatchNo}\n车辆：${plateNo}\n司机：${driverName}\n园区：${yardName}\n时间：${departTime}\n请司机尽快出发！',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.dispatch.driverName || '-',
      yardName: yard?.name || '-',
      departTime: nowIsoString(),
    },
    yardId: args.yardId,
    dispatchId: args.dispatch.id,
  })
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
  const yard = (await mockDB.listYards()).find((y) => y.id === args.yardId)
  return pushByTemplate({
    templateCode: 'LOADING_NOTIFY',
    fallbackContent:
      '【通知装货】\n调车单：${dispatchNo}\n车辆：${plateNo}\n司机：${driverName}\n请到 ${yardName} 园区装货！\n时间：${loadingTime}',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.dispatch.driverName || '-',
      yardName: yard?.name || '-',
      loadingTime: nowIsoString(),
    },
    yardId: args.yardId,
    dispatchId: args.dispatch.id,
  })
}

/**
 * 推送"车辆出厂"消息（v0.2.0-M2：库房装货完成 → 司机 H5 消息中心）
 *
 * 模板 code：TRANSIT_NOTIFY
 */
export async function pushTransitNotify(args: {
  dispatch: Dispatch
}): Promise<PushLog | null> {
  return pushByTemplate({
    templateCode: 'TRANSIT_NOTIFY',
    fallbackContent:
      '【装货完成】\n调车单：${dispatchNo}\n车辆：${plateNo}\n司机：${driverName}\n客户：${customerName}\n时间：${transitTime}\n请注意行车安全！',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.dispatch.driverName || '-',
      customerName: args.dispatch.goods[0]?.customerName || '-',
      transitTime: nowIsoString(),
    },
    recipient: args.dispatch.driverName || '-',
    dispatchId: args.dispatch.id,
  })
}

/**
 * 推送"已到达客户园区"消息（v0.2.0-M2：GPS 入客户园区 → 司机 H5 + 调度群）
 *
 * 模板 code：ARRIVED_NOTIFY
 */
export async function pushArrivedNotify(args: {
  dispatch: Dispatch
  arrivedAt: string
}): Promise<PushLog | null> {
  return pushByTemplate({
    templateCode: 'ARRIVED_NOTIFY',
    fallbackContent:
      '【已到达客户园区】\n调车单：${dispatchNo}\n车辆：${plateNo}\n司机：${driverName}\n客户：${customerName}\n时间：${arrivedTime}\n请司机在 H5 确认到达！',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.dispatch.driverName || '-',
      customerName: args.dispatch.goods[0]?.customerName || '-',
      arrivedTime: args.arrivedAt,
    },
    recipient: '调度群',
    dispatchId: args.dispatch.id,
  })
}

/**
 * 推送"客户签收完成"消息（v0.2.0-M2：客户签收 → 司机 + 调度群）
 *
 * 模板 code：SIGN_NOTIFY
 */
export async function pushSignNotify(args: {
  dispatch: Dispatch
  signedAt: string
  photoCount: number
}): Promise<PushLog | null> {
  return pushByTemplate({
    templateCode: 'SIGN_NOTIFY',
    fallbackContent:
      '【签收完成】\n调车单：${dispatchNo}\n车辆：${plateNo}\n司机：${driverName}\n客户：${customerName}\n时间：${signedTime}\n签收照片：${photoCount} 张\n订单已完成！',
    vars: {
      dispatchNo: args.dispatch.dispatchNo,
      plateNo: args.dispatch.vehicleNo || '-',
      driverName: args.dispatch.driverName || '-',
      customerName: args.dispatch.goods[0]?.customerName || '-',
      signedTime: args.signedAt,
      photoCount: String(args.photoCount),
    },
    recipient: '调度群',
    dispatchId: args.dispatch.id,
  })
}