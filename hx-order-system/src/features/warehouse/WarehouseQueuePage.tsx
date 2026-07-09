import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, message, Empty, Select, Tooltip } from 'antd'
import { ReloadOutlined, EyeOutlined, ClockCircleOutlined, TruckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageContainer, SearchForm, SCROLL_PRESETS, StatusTag } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import type { Dispatch, DispatchStatus } from '@/types/dispatch'

/** DispatchStatus 字典（用于 StatusTag 注入） */
const DISPATCH_STATUS_MAP = Object.fromEntries(
  DISPATCH_STATUS_OPTIONS.map((o) => [o.value, { label: o.label, color: o.color }]),
) as Record<DispatchStatus, { label: string; color: string }>
import { formatDuration, getTotalQueueMs } from '@/utils/dispatchTimeline'
import { pushLoadingNotify } from '@/services/dingtalk'
import { NotifyDepartModal } from './components/NotifyDepartModal'
import { nowIsoString } from '@/utils'

/**
 * 库房排队管理（M3 阶段：GPS 自动打卡 + 库房主动推进）
 *
 * 按钮组按 dispatch.status 重写：
 *  - dispatched → 「通知出发」（弹 NotifyDepartModal，H5 司机收推送）
 *  - entering   → 「通知装货」（写 loadingNotifiedAt，status → loading）
 *  - loading    → 「装货完成」（写 loadingCompletedAt，status → leaving）
 *  - leaving    → 仅 Tag「等待 GPS 离厂」（删除原"通知离场"按钮）
 *  - completed  → 仅"详情"跳转
 */
export function WarehouseQueuePage() {
  const navigate = useNavigate()
  const { list, load, notifyLoading, markLoadingCompleted } = useDispatchStore()
  const { yards, loadYards } = useDictStore()
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  // 通知出发 Modal 状态
  const [departOpen, setDepartOpen] = useState(false)
  const [departTarget, setDepartTarget] = useState<{ dispatch: Dispatch; yardId: string } | null>(null)

  useEffect(() => {
    load()
    loadYards()
  }, [load, loadYards])

  // 仅显示 M3 涉及的 5 个状态（已派车 + 之后的所有中间态 + completed）
  const M2_STATUSES = ['dispatched', 'entering', 'loading', 'leaving', 'completed']
  const filtered = useMemo(() => {
    return list.filter((d) => {
      if (!M2_STATUSES.includes(d.status)) return false
      if (filters.yardId) {
        if (!(d.yardIds || []).includes(filters.yardId as string)) return false
      }
      if (filters.companyId) {
        if (d.companyId !== filters.companyId) return false
      }
      if (filters.status && d.status !== filters.status) return false
      return true
    })
  }, [list, filters])

  const stats = useMemo(() => {
    const queueing = list.filter((d) => ['dispatched', 'entering'].includes(d.status)).length
    const loading = list.filter((d) => d.status === 'leaving').length
    const today = new Date().toISOString().slice(0, 10)
    const completedToday = list.filter(
      (d) => d.status === 'completed' && d.completedAt?.startsWith(today),
    ).length
    const totalMs = list
      .filter((d) => d.status === 'completed' || d.status === 'leaving')
      .reduce((sum, d) => sum + getTotalQueueMs(d), 0)
    const avgMs = queueing + loading + completedToday > 0 ? Math.round(totalMs / (queueing + loading + completedToday)) : 0
    return { queueing, loading, completedToday, avgMs }
  }, [list])

  /** 获取某调车单的第一个未离场园区（即当前进行中的园区） */
  const getActiveYard = (d: Dispatch) => {
    return d.yardTimelines?.find((y) => !y.leftAt)
  }

  /** 处理"通知出发" */
  const handleNotifyDepart = (d: Dispatch) => {
    const active = getActiveYard(d)
    if (!active) {
      message.warning('该调车单所有园区已完成')
      return
    }
    setDepartTarget({ dispatch: d, yardId: active.yardId })
    setDepartOpen(true)
  }

  /** 处理"通知装货" */
  const handleNotifyLoading = async (d: Dispatch) => {
    const active = getActiveYard(d)
    if (!active) return
    const ts = nowIsoString()
    await notifyLoading(d.id, active.yardId, ts)
    await pushLoadingNotify({ dispatch: d, yardId: active.yardId })
    message.success(`已通知装货：${active.yardName || active.yardId}`)
  }

  /** 处理"装货完成" */
  const handleLoadingComplete = async (d: Dispatch) => {
    const active = getActiveYard(d)
    if (!active) return
    await markLoadingCompleted(d.id, active.yardId, new Date().toISOString())
    message.success(`已标记 ${active.yardName || active.yardId} 装货完成`)
  }

  return (
    <PageContainer
      title="库房排队管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          手动刷新
        </Button>
      }
    >
      {/* 顶部统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="排队/入场中" value={stats.queueing} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="装货/离场中" value={stats.loading} prefix={<TruckOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日已完成" value={stats.completedToday} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均等待时长" value={formatDuration(stats.avgMs)} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* 筛选 */}
      <SearchForm
        items={[
          {
            name: 'yardId',
            label: '园区',
            type: 'select',
            options: yards.map((y) => ({ value: y.id, label: y.name })),
          },
          {
            name: 'status',
            label: '状态',
            type: 'select',
            options: DISPATCH_STATUS_OPTIONS.filter((s) => M2_STATUSES.includes(s.value)).map((s) => ({
              value: s.value,
              label: s.label,
            })),
          },
        ]}
        onSearch={setFilters}
      />

      {/* 表格 */}
      <Card>
        <Table<Dispatch>
          rowKey="id"
          dataSource={filtered}
          locale={{ emptyText: <Empty description="暂无排队车辆" /> }}
          columns={[
            { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
            {
              title: '当前园区',
              width: 120,
              render: (_, r) => {
                const active = getActiveYard(r)
                return active ? <Tag color="cyan">{active.yardName || active.yardId}</Tag> : <span style={{ color: '#999' }}>-</span>
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s) => <StatusTag value={s} map={DISPATCH_STATUS_MAP} />,
            },
            { title: '车牌', dataIndex: 'vehicleNo', width: 100 },
            { title: '司机', dataIndex: 'driverName', width: 100 },
            { title: '公司', dataIndex: 'companyName', width: 180, ellipsis: true },
            {
              title: '等待时长',
              width: 110,
              render: (_, r) => {
                const active = getActiveYard(r)
                if (!active?.queuedAt) return '-'
                const ms = Date.now() - new Date(active.queuedAt).getTime()
                return <span style={{ color: ms > 3600000 ? '#cf1322' : '#1677ff' }}>{formatDuration(ms)}</span>
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 280,
              render: (_, r) => {
                const active = getActiveYard(r)
                if (!active) {
                  // 全部完成：跳转详情页查看 YardTimelineView（追溯历史）
                  return (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/warehouse/dispatch/${r.id}`)}
                    >
                      详情
                    </Button>
                  )
                }
                return (
                  <Space size="small">
                    {/* dispatched → 通知出发 */}
                    {r.status === 'dispatched' && (
                      <Button type="link" size="small" onClick={() => handleNotifyDepart(r)}>
                        通知出发
                      </Button>
                    )}
                    {/* entering → 通知装货 */}
                    {r.status === 'entering' && (
                      <Button type="link" size="small" onClick={() => handleNotifyLoading(r)}>
                        通知装货
                      </Button>
                    )}
                    {/* loading → 装货完成 */}
                    {r.status === 'loading' && (
                      <Button type="primary" size="small" onClick={() => handleLoadingComplete(r)}>
                        装货完成
                      </Button>
                    )}
                    {/* leaving → 等待 GPS 离厂（无操作） */}
                    {r.status === 'leaving' && (
                      <Tooltip title="车辆已装货完成，等待 GPS 离开园区半径自动完成">
                        <StatusTag value="leaving" map={DISPATCH_STATUS_MAP} />
                      </Tooltip>
                    )}
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/warehouse/dispatch/${r.id}`)}
                    >
                      详情
                    </Button>
                  </Space>
                )
              },
            },
          ]}
          scroll={{ x: SCROLL_PRESETS.medium }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 通知出发 Modal */}
      <NotifyDepartModal
        open={departOpen}
        dispatch={departTarget?.dispatch || null}
        yardId={departTarget?.yardId || null}
        yardName={
          departTarget
            ? yards.find((y) => y.id === departTarget.yardId)?.name
            : undefined
        }
        onClose={() => setDepartOpen(false)}
      />
    </PageContainer>
  )
}
