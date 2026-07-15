import { Card, Empty, Tag, Timeline } from 'antd'
import type { Dispatch, YardTimeline } from '@/types/dispatch'
import { formatDuration, getTotalQueueMs } from '@/utils/dispatchTimeline'
import { formatDateTime } from '@/utils'

interface Props {
  dispatch: Dispatch
}

/**
 * 调车单多园区时间线视图（v0.3.0-M2.2 状态机 v2）
 *
 * 节点顺序（按时间轴，一条 Timeline 流）：
 *  库房段（每园区）：
 *   1. 排队登记（queuedAt）— blue（M2.2 v2:GPS / 扫码统一入口）
 *   2. 库房通知出发/道闸放行（notifyDepartAt）— cyan
 *   3. 车辆入园（enteredAt）— geekblue + GPS/扫码/人工 标签
 *   4. 库房通知装货（loadingNotifiedAt）— gold
 *   5. 装货完成（loadingCompletedAt）— purple
 *   6. 车辆离厂（leftAt）— green + GPS/扫码/人工 标签
 *  到货段（仅第一个 timeline 拼接，避免多园区重复）：
 *   7. 车辆出厂（leftYardAt）— gold（链式触发 in_transit）
 *   8. GPS 入客户园区（arrivedByGpsAt）— lime（仅作时间记录，不再驱动状态）
 *   9. 司机确认到达（driverConfirmedAt）— cyan + 手动 标签
 *
 *  ❌ v0.3.0-M2.2 删除：客户签收节点（signedAt/signaturePhotos/signatureNote）
 *  因为客户签收 H5 已下线，司机 H5 确认即完成
 */
export function YardTimelineView({ dispatch }: Props) {
  const timelines = dispatch.yardTimelines || []
  if (timelines.length === 0) {
    return <Empty description="暂无园区时间线" />
  }

  const totalQueue = getTotalQueueMs(dispatch)
  const firstTl = timelines[0]  // 到货节点演示用第一个 timeline

  const renderEnterTag = (y: YardTimeline) => {
    if (y.enteredVia === 'gps') return <Tag color="blue" style={{ marginLeft: 6 }}>GPS</Tag>
    if (y.enteredVia === 'scan') return <Tag style={{ marginLeft: 6 }}>扫码</Tag>
    if (y.enteredVia === 'manual') return <Tag color="default" style={{ marginLeft: 6 }}>人工</Tag>
    return null
  }

  const renderLeftTag = (y: YardTimeline) => {
    if (y.leftVia === 'gps') return <Tag color="blue" style={{ marginLeft: 6 }}>GPS</Tag>
    if (y.leftVia === 'scan') return <Tag style={{ marginLeft: 6 }}>扫码</Tag>
    if (y.leftVia === 'manual') return <Tag color="default" style={{ marginLeft: 6 }}>人工</Tag>
    return null
  }

  return (
    <div>
      {timelines.map((y: YardTimeline, idx: number) => {
        const queueMs =
          y.queuedAt && y.enteredAt
            ? new Date(y.enteredAt).getTime() - new Date(y.queuedAt).getTime()
            : 0

        // 库房段节点 + 到货段节点（仅第一个 timeline 拼接，避免多园区重复）
        const isFirst = idx === 0
        const items: { color?: string; children: React.ReactNode }[] = [
          ...(y.queuedAt
            ? [{ color: 'blue', children: <span>排队登记 {formatDateTime(y.queuedAt)}</span> }]
            : []),
          ...(y.notifyDepartAt
            ? [{ color: 'cyan', children: <span>通知出发 {formatDateTime(y.notifyDepartAt)}</span> }]
            : []),
          ...(y.enteredAt
            ? [
                {
                  color: 'geekblue',
                  children: (
                    <span>
                      入园 {formatDateTime(y.enteredAt)}
                      {renderEnterTag(y)}
                    </span>
                  ),
                },
              ]
            : []),
          ...(y.loadingNotifiedAt
            ? [
                {
                  color: 'gold',
                  children: <span>通知装货 {formatDateTime(y.loadingNotifiedAt)}</span>,
                },
              ]
            : []),
          ...(y.loadingCompletedAt
            ? [
                {
                  color: 'purple',
                  children: <span>装货完成 {formatDateTime(y.loadingCompletedAt)}</span>,
                },
              ]
            : []),
          ...(y.leftAt
            ? [
                {
                  color: 'green',
                  children: (
                    <span>
                      离厂 {formatDateTime(y.leftAt)}
                      {renderLeftTag(y)}
                    </span>
                  ),
                },
              ]
            : []),
          // —— v0.2.0-M2：到货段节点（仅第一个 timeline）——
          ...(isFirst && y.leftYardAt
            ? [
                {
                  color: 'gold',
                  children: (
                    <span>
                      车辆出厂 {formatDateTime(y.leftYardAt)}
                      <Tag color="gold" style={{ marginLeft: 6 }}>链式</Tag>
                    </span>
                  ),
                },
              ]
            : []),
          ...(isFirst && y.arrivedByGpsAt
            ? [
                {
                  color: 'lime',
                  children: (
                    <span>
                      GPS 入客户园区 {formatDateTime(y.arrivedByGpsAt)}
                      <Tag color="blue" style={{ marginLeft: 6 }}>GPS</Tag>
                    </span>
                  ),
                },
              ]
            : []),
          ...(isFirst && y.driverConfirmedAt
            ? [
                {
                  color: 'cyan',
                  children: (
                    <span>
                      司机确认到达 {formatDateTime(y.driverConfirmedAt)}
                      <Tag color="cyan" style={{ marginLeft: 6 }}>手动</Tag>
                    </span>
                  ),
                },
              ]
            : []),
          // ❌ v0.3.0-M2.2 删除:y.signedAt 客户签收节点全段(签名照片 + 备注)
        ]    // ← 这里为什么要有个换行?

        return (
          <Card
            key={y.yardId}
            size="small"
            title={`${idx + 1}. ${y.yardName || y.yardId}`}
            style={{ marginBottom: 12 }}
          >
            <Timeline items={items} />
            {queueMs > 0 && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  background: '#f0f5ff',
                  border: '1px solid #adc6ff',
                  borderRadius: 4,
                  fontSize: 13,
                  color: '#1677ff',
                  display: 'inline-block',
                }}
              >
                本园区等待时长：{formatDuration(queueMs)}
              </div>
            )}
          </Card>
        )
      })}

      {totalQueue > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: '#f0f5ff',
            border: '1px solid #adc6ff',
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          总等待时长（{timelines.length} 个园区累加）：{formatDuration(totalQueue)}
        </div>
      )}
    </div>
  )
}
