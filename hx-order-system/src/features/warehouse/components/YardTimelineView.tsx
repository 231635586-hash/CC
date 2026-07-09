import { Card, Empty, Tag, Timeline } from 'antd'
import type { Dispatch, YardTimeline } from '@/types/dispatch'
import { formatDuration, getTotalQueueMs } from '@/utils/dispatchTimeline'
import { formatDateTime } from '@/utils'

interface Props {
  dispatch: Dispatch
}

/**
 * 调车单多园区时间线视图（M3 阶段：GPS 自动打卡）
 *
 * 节点顺序（按时间轴）：
 *  1. 排队登记（queuedAt）— blue
 *  2. 库房通知出发（notifyDepartAt）— cyan；旧 notifiedAt 兼容
 *  3. 车辆入园（enteredAt）— geekblue + 标签（GPS / 扫码 / 人工）
 *  4. 库房通知装货（loadingNotifiedAt）— gold
 *  5. 装货完成（loadingCompletedAt）— purple
 *  6. 车辆离厂（leftAt）— green + 标签（GPS / 扫码 / 人工）
 */
export function YardTimelineView({ dispatch }: Props) {
  const timelines = dispatch.yardTimelines || []
  if (timelines.length === 0) {
    return <Empty description="暂无园区时间线" />
  }

  const totalQueue = getTotalQueueMs(dispatch)

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
        return (
          <Card
            key={y.yardId}
            size="small"
            title={`${idx + 1}. ${y.yardName || y.yardId}`}
            style={{ marginBottom: 12 }}
          >
            <Timeline
              items={[
                ...(y.queuedAt
                  ? [{ color: 'blue', children: <span>排队登记 {formatDateTime(y.queuedAt)}</span> }]
                  : []),
                // 库房"通知出发"
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
              ]}
            />
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
                ⏱️ 本园区等待时长：{formatDuration(queueMs)}
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
          📊 总等待时长（{timelines.length} 个园区累加）：{formatDuration(totalQueue)}
        </div>
      )}
    </div>
  )
}
