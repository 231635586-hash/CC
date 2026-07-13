import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, message, Empty, Select, Tooltip, Modal, Input, QRCode, Alert, Typography } from 'antd'
const { Text } = Typography
import { ReloadOutlined, EyeOutlined, ClockCircleOutlined, TruckOutlined, LinkOutlined, QrcodeOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageContainer, SearchForm, SCROLL_PRESETS, StatusTag, DISPATCH_STATUS_MAP } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import type { Dispatch } from '@/types/dispatch'
import { formatDuration, getTotalQueueMs } from '@/utils/dispatchTimeline'
import { NotifyLoadingModal } from './components/NotifyLoadingModal'
import { nowIsoString } from '@/utils'
import { copyToClipboard } from '@/utils/clipboard'

/**
 * 库房排队管理（v0.2.0-M2：状态机简化 + 库房员生成签收链接）
 *
 * 按钮组按 dispatch.status 重写（v0.2.0-M2 简化）：
 *  - dispatched → 「通知出发」（弹 NotifyDepartModal，H5 司机收推送）
 *  - loading    → 「装货完成」（写 loadingCompletedAt，status → leaving）
 *                   entering 状态被合并：GPS 入库后系统自动转 loading
 *                   库房员无需手动「通知装货」（v0.2.0-M2 流程优化）
 *  - leaving    → 「生成签收链接」（装货完成后立刻生成客户签收链接，
 *                   调度员复制/扫码发给客户；订单详情页实时同步）
 *  - completed  → 仅"详情"跳转
 */
export function WarehouseQueuePage() {
  const navigate = useNavigate()
  const { list, load, markLoadingCompleted, notifyLoading, generateSignUrl } = useDispatchStore()
  const { yards, loadYards } = useDictStore()
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  // 通知出发 Modal 状态
  const [departOpen, setDepartOpen] = useState(false)
  const [departTarget, setDepartTarget] = useState<{ dispatch: Dispatch; yardId: string } | null>(null)
  // v0.2.0-M2：签收链接 Modal 状态
  const [signUrlOpen, setSignUrlOpen] = useState(false)
  const [signUrlRecord, setSignUrlRecord] = useState<Dispatch | null>(null)
  const [signUrlLoading, setSignUrlLoading] = useState(false)

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

  /** 处理"装货完成" — v0.2.0-M2 改造：装货完成后立即弹签收链接 Modal，一气呵成 */
  const handleLoadingComplete = async (d: Dispatch) => {
    const active = getActiveYard(d)
    if (!active) return
    await markLoadingCompleted(d.id, active.yardId, new Date().toISOString())
    message.success(`已标记 ${active.yardName || active.yardId} 装货完成`)
    // 立即弹签收链接 Modal，调度员无须离开页面继续生成链接
    // 通过 dispatch store 自动 reload 后取到最新 record
    const updated = useDispatchStore.getState().list.find((x) => x.id === d.id)
    setSignUrlRecord(updated || d)
    setSignUrlOpen(true)
  }

  /** v0.2.0-M2：打开「生成签收链接」Modal（leaving 状态触发） */
  const handleOpenSignUrl = (d: Dispatch) => {
    // 已有链接：直接展示（允许重新生成）
    setSignUrlRecord(d)
    setSignUrlOpen(true)
  }

  /** v0.2.0-M2：生成 / 重新生成签收链接 */
  const handleGenerateSignUrl = async () => {
    if (!signUrlRecord) return
    setSignUrlLoading(true)
    try {
      await generateSignUrl(signUrlRecord.id, 24)
      message.success('已生成签收链接')
      // store save() 会自动 reload，signUrlRecord 通过 setSignUrlRecord 重新绑定
      const updated = useDispatchStore.getState().list.find((x) => x.id === signUrlRecord.id)
      if (updated) setSignUrlRecord(updated)
    } catch (e) {
      message.error('生成失败：' + (e as Error).message)
    } finally {
      setSignUrlLoading(false)
    }
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
              width: 160,
              render: (s) => (
                <Space size={4}>
                  <StatusTag value={s} map={DISPATCH_STATUS_MAP} />
                  {s === 'dispatched' && (
                    <Tooltip title="等待车辆硬件 GPS 入园（库房员无需操作）">
                      <Tag color="cyan" icon={<EnvironmentOutlined />}>等 GPS</Tag>
                    </Tooltip>
                  )}
                  {s === 'entering' && (
                    <Tooltip title="库房员需点「通知装货」放行进园">
                      <Tag color="gold">待放行</Tag>
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
                    {/* dispatched → 等待 GPS 入园（库房员无按钮，等车辆硬件 GPS 自动转 entering） */}
                    {r.status === 'dispatched' && (
                      <Tooltip title="车辆 GPS 入园后系统自动转 entering">
                        <Tag color="cyan">等待 GPS 入园</Tag>
                      </Tooltip>
                    )}
                    {/* entering → 通知装货（v0.2.0-M2.2 业务调整：库房员确认司机到门口后放行进园装货） */}
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
                    {/* leaving → 生成签收链接（v0.2.0-M2：库房员装货完成后立即生成） */}
                    {r.status === 'leaving' && (
                      <Space size={4}>
                        {r.signUrl ? (
                          <Tooltip title={`链接已生成（${r.signUrlExpiresInHours || 24}h 有效期），点击查看/复制`}>
                            <Button
                              type="primary"
                              size="small"
                              icon={<LinkOutlined />}
                              onClick={() => handleOpenSignUrl(r)}
                            >
                              查看签收链接
                            </Button>
                          </Tooltip>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<QrcodeOutlined />}
                            onClick={() => handleOpenSignUrl(r)}
                          >
                            生成签收链接
                          </Button>
                        )}
                      </Space>
                    )}
                    {/* in_transit / arrived_by_gps / driver_confirmed → 若已生成链接，仍可查看 */}
                    {(r.status === 'in_transit' || r.status === 'arrived_by_gps' || r.status === 'driver_confirmed') && r.signUrl && (
                      <Tooltip title="链接已发给客户，点击查看">
                        <Button
                          type="link"
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={() => handleOpenSignUrl(r)}
                        >
                          签收链接
                        </Button>
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

      {/* 通知装货 Modal（v0.2.0-M2.2：库房员在 entering 状态点） */}
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

      {/* v0.2.0-M2：装货完成 → 生成签收链接 一气呵成 Modal */}
      <Modal
        title={`已装货完成 - ${signUrlRecord?.dispatchNo || ''}`}
        open={signUrlOpen}
        onCancel={() => setSignUrlOpen(false)}
        width={620}
        footer={signUrlRecord?.signUrl ? [
          <Button key="copy" type="primary" icon={<LinkOutlined />} onClick={async () => {
            if (signUrlRecord?.signUrl) {
              const ok = await copyToClipboard(signUrlRecord.signUrl)
              if (ok) message.success('链接已复制到剪贴板')
              else message.error('复制失败，请手动选中链接复制')
            }
          }}>
            复制链接
          </Button>,
          <Button key="regen" loading={signUrlLoading} onClick={handleGenerateSignUrl}>重新生成</Button>,
          <Button key="open" onClick={() => signUrlRecord?.signUrl && window.open(signUrlRecord.signUrl, '_blank')}>
            在新窗口打开
          </Button>,
          <Button key="close" onClick={() => setSignUrlOpen(false)}>关闭</Button>,
        ] : [
          <Button key="gen" type="primary" icon={<QrcodeOutlined />} loading={signUrlLoading} onClick={handleGenerateSignUrl}>
            生成签收链接
          </Button>,
          <Button key="close" onClick={() => setSignUrlOpen(false)}>稍后再生成</Button>,
        ]}
      >
        {/* 第一段：装货完成确认（已写入状态机的 leaving 状态） */}
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space>
              <Text strong>已标记装货完成</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                状态已推进至 leaving，调度员可立即生成客户签收链接
              </Text>
            </Space>
          }
        />

        {/* 装货确认信息卡 */}
        {signUrlRecord && (
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>调车单号</Text>
                <div><Text strong>{signUrlRecord.dispatchNo}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>园区</Text>
                <div><Text strong>{(signUrlRecord.yardIds || []).map((id) => yards.find((y) => y.id === id)?.name || id).join('、')}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>车牌 / 司机</Text>
                <div><Text>{signUrlRecord.vehicleNo || '-'} / {signUrlRecord.driverName || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>货物</Text>
                <div><Text>{signUrlRecord.goods.length} 项 / {signUrlRecord.goods.reduce((s, g) => s + (g.quantity || 0), 0)} 件</Text></div>
              </Col>
            </Row>
          </Card>
        )}

        {/* 第二段：签收链接展示（已生成时）或引导（未生成时） */}
        {signUrlRecord?.signUrl ? (
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="链接已生成。将链接通过微信/短信发给客户，或让客户扫码。"
            />
            <Row gutter={16}>
              <Col span={13}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>签收链接</Text>
                <Input.TextArea
                  value={signUrlRecord.signUrl}
                  readOnly
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>有效期：</Text>
                  <Tag color="blue">{signUrlRecord.signUrlExpiresInHours || 24} 小时</Tag>
                  {signUrlRecord.signUrlGeneratedAt && (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      生成于 {signUrlRecord.signUrlGeneratedAt}
                    </Text>
                  )}
                </div>
              </Col>
              <Col span={11}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ display: 'block', marginBottom: 6 }}>扫码访问</Text>
                  <div style={{
                    display: 'inline-block',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                  }}>
                    <QRCode value={signUrlRecord.signUrl} size={140} />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>客户手机扫码直接打开</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <Card size="small" style={{ background: '#f0f5ff', borderColor: '#adc6ff', textAlign: 'center', padding: '20px 0' }}>
            <QrcodeOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 12 }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong>下一步：生成客户签收链接</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              链接生成后将显示二维码 + URL，复制发给客户即可
            </Text>
          </Card>
        )}
      </Modal>
    </PageContainer>
  )
}
