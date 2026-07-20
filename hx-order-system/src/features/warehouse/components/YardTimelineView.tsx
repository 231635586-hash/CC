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
 * v1.0 调整：节点按时间戳升序动态排序（不再硬编码业务顺序）
 * 原因：用户期望"GPS 类"节点按真实发生时间显示；同时兼容
 * mock 数据或手填数据中 timestamp 略有偏差的场景。
 *
 * 字段约定见 types/dispatch.ts YardTimeline 注释：
 *  库房段：queuedAt → notifyDepartAt → enteredAt → loadingNotifiedAt
 *          → loadingCompletedAt → leftAt
 *  到货段（仅 first timeline）：leftYardAt → arrivedByGpsAt → driverConfirmedAt
 *
 * 同时间戳时按业务关键度优先级排序，避免抖动。
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

  // 同时间戳的业务关键度优先级
  const PRIO: Record<string, number> = {
    '排队登记': 1,
    '通知出发': 2,
    '入园': 3,
    '通知装货': 4,
    '装货完成': 5,
    '离厂': 6,
    '车辆出厂': 7,
    'GPS 入客户园区': 8,
    '司机确认到达': 9,
  }

  return (
    <div>
      {timelines.map((y: YardTimeline, idx: number) => {
        const queueMs =
          y.queuedAt && y.enteredAt
            ? new Date(y.enteredAt).getTime() - new Date(y.queuedAt).getTime()
            : 0

        const isFirst = idx === 0

        // 收集所有有时间戳的节点 → 按时间戳升序排序
        type NodeT = { ts: number; key: string; node: { color?: string; children: React.ReactNode } }
        const nodes: NodeT[] = []
        const add = (
          ts: string | undefined,
          key: string,
          n: { color?: string; children: React.ReactNode },
        ) => {
          if (ts) nodes.push({ ts: new Date(ts).getTime(), key, node: n })
        }

        add(y.queuedAt, 'queuedAt', {
          color: 'blue',
          children: <span>排队登记 {formatDateTime(y.queuedAt!)}</span>,
        })
        add(y.notifyDepartAt, 'notifyDepartAt', {
          color: 'cyan',
          children: <span>通知出发 {formatDateTime(y.notifyDepartAt!)}</span>,
        })
        add(y.enteredAt, 'enteredAt', {
          color: 'geekblue',
          children: (
            <span>
              入园 {formatDateTime(y.enteredAt!)}
              {renderEnterTag(y)}
            </span>
          ),
        })
        add(y.loadingNotifiedAt, 'loadingNotifiedAt', {
          color: 'gold',
          children: <span>通知装货 {formatDateTime(y.loadingNotifiedAt!)}</span>,
        })
        add(y.loadingCompletedAt, 'loadingCompletedAt', {
          color: 'purple',
          children: <span>装货完成 {formatDateTime(y.loadingCompletedAt!)}</span>,
        })
        add(y.leftAt, 'leftAt', {
          color: 'green',
          children: (
            <span>
              离厂 {formatDateTime(y.leftAt!)}
              {renderLeftTag(y)}
            </span>
          ),
        })
        if (isFirst && y.leftYardAt) {
          add(y.leftYardAt, 'leftYardAt', {
            color: 'gold',
            children: (
              <span>
                车辆出厂 {formatDateTime(y.leftYardAt!)}
                <Tag color="gold" style={{ marginLeft: 6 }}>链式</Tag>
              </span>
            ),
          })
        }
        if (isFirst && y.arrivedByGpsAt) {
          add(y.arrivedByGpsAt, 'arrivedByGpsAt', {
            color: 'lime',
            children: (
              <span>
                GPS 入客户园区 {formatDateTime(y.arrivedByGpsAt!)}
                <Tag color="blue" style={{ marginLeft: 6 }}>GPS</Tag>
              </span>
            ),
          })
        }
        if (isFirst && y.driverConfirmedAt) {
          add(y.driverConfirmedAt, 'driverConfirmedAt', {
            color: 'cyan',
            children: (
              <span>
                司机确认到达 {formatDateTime(y.driverConfirmedAt!)}
                <Tag color="cyan" style={{ marginLeft: 6 }}>手动</Tag>
              </span>
            ),
          })
        }

        nodes.sort((a, b) => {
          if (a.ts !== b.ts) return a.ts - b.ts
          // 同时间戳：按业务关键度排序
          return (PRIO[a.key] ?? 99) - (PRIO[b.key] ?? 99)
        })
        const items = nodes.map((n) => n.node)

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
