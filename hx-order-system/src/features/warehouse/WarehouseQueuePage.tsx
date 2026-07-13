import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, message, Empty, Tooltip } from 'antd'
import { ReloadOutlined, EyeOutlined, ClockCircleOutlined, TruckOutlined, EnvironmentOutlined, GatewayOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageContainer, SearchForm, SCROLL_PRESETS, StatusTag, DISPATCH_STATUS_MAP } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import type { Dispatch } from '@/types/dispatch'
import { formatDuration, getTotalQueueMs } from '@/utils/dispatchTimeline'
import { NotifyLoadingModal } from './components/NotifyLoadingModal'
import { nowIsoString } from '@/utils'

/**
 * 库房排队管理（v0.3.0-M2.2：状态机 v2）
 *
 * 状态机：dispatched → queued → entering → loading → leaving → in_transit → driver_confirmed → completed
 *
 * 按钮组按 dispatch.status：
 *  - dispatched  → 等 GPS / 等司机扫码（库房员无操作）
 *  - queued      → 【通知入场(Mock 道闸)】3 秒后自动开闸
 *  - entering    → 【通知装货】弹 NotifyLoadingModal 二次确认
 *  - loading     → 【装货完成】写 loadingCompletedAt
 *  - leaving     → 仅"详情"（已无客户签收环节）
 *  - completed   → 仅"详情"
 */
export function WarehouseQueuePage() {
  const navigate = useNavigate()
  const { list, load, markLoadingCompleted, notifyLoading, triggerGateOpen } = useDispatchStore()
  const { yards, loadYards } = useDictStore()
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  // 通知装货 Modal 状态
  const [departOpen, setDepartOpen] = useState(false)
  const [departTarget, setDepartTarget] = useState<{ dispatch: Dispatch; yardId: string } | null>(null)
  // ❌ v0.3.0-M2.2 删除：签收链接相关 state(M5 已下线客户签收)

  useEffect(() => {
    load()
    loadYards()
  }, [load, loadYards])

  // M2.2 v2：扩展 5 状态 → 6 状态，新增 queued
  const M2_STATUSES = ['queued', 'dispatched', 'entering', 'loading', 'leaving', 'completed']
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
    // M2.2 v2:queued 也算排队中
    const queueing = list.filter((d) => ['dispatched', 'queued', 'entering'].includes(d.status)).length
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

  /**
   * M2.2 v2：处理"通知入场"(queued → entering)
   *  - 库房员在 queued 状态点【通知入场(Mock 道闸)】
   *  - mock 阶段：3 秒后自动开闸（模拟道闸 API 延迟）
   *  - 实际生产：调用真实道闸 API
   */
  const handleNotifyEntry = async (d: Dispatch) => {
    const activeYard = d.yardTimelines.find((y) => y.queuedAt && !y.enteredAt)
    if (!activeYard) {
      message.warning('该调车单没有排队中的园区')
      return
    }
    if (d.status !== 'queued') {
      message.warning('当前状态不是"排队中",无法通知入场')
      return
    }
    message.loading('已发送放行指令到道闸系统,3 秒后自动开闸...', 2.5)
    setTimeout(async () => {
      try {
        await triggerGateOpen(d.id, activeYard.yardId, nowIsoString())
        message.success('🚪 道闸已开闸,车辆进入')
      } catch (e) {
        message.error('开闸失败:' + (e as Error).message)
      }
    }, 3000)
  }

  /**
   * 处理"通知装货"（v0.2.0-M2.2 业务调整）：
   *  - 库房员在 entering 状态点 → 写 loadingNotifiedAt → loading
   *  - 弹 Modal 二次确认（避免误操作）
   */
  const handleNotifyLoading = (d: Dispatch) => {
    const active = getActiveYard(d)
    if (!active) {
      message.warning('该调车单所有园区已完成')
      return
    }
    if (d.status !== 'entering') {
      message.warning('车辆未入园，无法通知装货')
      return
    }
    setDepartTarget({ dispatch: d, yardId: active.yardId })
    setDepartOpen(true)
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

      {/* ====== M2.2 v2：排队中看板(等待道闸放行) ====== */}
      <Card title="🚧 排队中(等待道闸放行)" style={{ marginBottom: 16 }} size="small">
        <Table<Dispatch>
          rowKey="id"
          size="small"
          dataSource={list.filter((d) => d.status === 'queued')}
          locale={{ emptyText: <Empty description="暂无排队中车辆" /> }}
          pagination={false}
          columns={[
            { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
            {
              title: '排队园区',
              width: 140,
              render: (_, r) => {
                const y = r.yardTimelines.find((tl) => tl.queuedAt && !tl.enteredAt)
                return y ? <Tag color="gold">{y.yardName || y.yardId}</Tag> : '-'
              },
            },
            { title: '车牌', dataIndex: 'vehicleNo', width: 100 },
            { title: '司机', dataIndex: 'driverName', width: 100 },
            {
              title: '排队时长',
              width: 110,
              render: (_, r) => {
                const y = r.yardTimelines.find((tl) => tl.queuedAt && !tl.enteredAt)
                if (!y?.queuedAt) return '-'
                const ms = Date.now() - new Date(y.queuedAt).getTime()
                return <span style={{ color: ms > 1800000 ? '#cf1322' : '#fa8c16' }}>{formatDuration(ms)}</span>
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 220,
              render: (_, r) => (
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    icon={<GatewayOutlined />}
                    onClick={() => handleNotifyEntry(r)}
                  >
                    🚪 通知入场(Mock 道闸)
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/warehouse/dispatch/${r.id}`)}
                  >
                    详情
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* 主表格 */}
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
              width: 160,
              render: (s) => (
                <Space size={4}>
                  <StatusTag value={s} map={DISPATCH_STATUS_MAP} />
                  {s === 'dispatched' && (
                    <Tooltip title="等待车辆硬件 GPS 入园或司机扫码（库房员无需操作）">
                      <Tag color="cyan" icon={<EnvironmentOutlined />}>等入场</Tag>
                    </Tooltip>
                  )}
                  {s === 'queued' && (
                    <Tooltip title="车辆已登记排队,等待库房员点【通知入场】">
                      <Tag color="gold">待放行</Tag>
                    </Tooltip>
                  )}
                  {s === 'entering' && (
                    <Tooltip title="车辆已入园,库房员需点【通知装货】">
                      <Tag color="geekblue">待通知装货</Tag>
                    </Tooltip>
                  )}
                </Space>
              ),
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
              width: 240,
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
                    {/* queued → 通知入场 */}
                    {r.status === 'queued' && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<GatewayOutlined />}
                        onClick={() => handleNotifyEntry(r)}
                      >
                        通知入场
                      </Button>
                    )}
                    {/* entering → 通知装货 */}
                    {r.status === 'entering' && (
                      <Button type="primary" size="small" onClick={() => handleNotifyLoading(r)}>
                        通知装货
                      </Button>
                    )}
                    {/* loading → 装货完成 */}
                    {r.status === 'loading' && (
                      <Button type="primary" size="small" onClick={() => handleLoadingComplete(r)}>
                        装货完成
                      </Button>
                    )}
                    {/* dispatched → 等待入场(库房员无操作) */}
                    {r.status === 'dispatched' && (
                      <Tooltip title="等 GPS/司机扫码后自动转 queued">
                        <Tag color="cyan">等待入场</Tag>
                      </Tooltip>
                    )}
                    {/* leaving → 无更多操作,跳转详情 */}
                    {r.status === 'leaving' && (
                      <span style={{ color: '#999', fontSize: 12 }}>装货完成,等离厂</span>
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

      {/* 通知装货 Modal（M2.2：库房员在 entering 状态点） */}
      <NotifyLoadingModal
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

      {/* ❌ v0.3.0-M2.2 删除：装货完成 → 生成签收链接 Modal(客户签收全链路已下线) */}
    </PageContainer>
  )
}
