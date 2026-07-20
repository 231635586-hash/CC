/**
 * 派车调度看板
 *
 * M1 增强（2026-06-25）：
 * - 4 个 Tab：全部 / 待派车 / 运输中 / 已完成
 * - 顶部筛选：关键词 / 方向 / 公司 / 园区
 * - 分页：默认 10 条，可切换 10 / 30 / 50 / 100
 * - 详情入口：所有 Tab 行尾【详情】按钮跳转 /marketing/dispatch/:id
 * - 实时刷新：WS 订阅接口（桩实现，UI 暂不展示；PRD 待补）
 *
 * 注：之前曾启用本地 5s 定时刷新 + UI 状态反馈，2026-06-25 按用户反馈撤回。
 *     WS 事件订阅代码保留，作为未来对接真实后端的"沉默开关"。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Table, Tag, Button, Space, Modal, Form, Select, message,
  Statistic, Empty, Tabs, Input,
} from 'antd'
import {
  TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, EnvironmentOutlined, SearchOutlined, EyeOutlined,
} from '@ant-design/icons'
import { PageContainer, renderYardNames } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import type { Dispatch } from '@/types/dispatch'
import { nowIsoString } from '@/utils'
import { on, WS_EVENTS } from '@/services/ws'

/** 调度阶段分组：把细粒度状态聚合成 3 组 */
type ScheduleStage = 'pending' | 'inProgress' | 'completed'

const STAGE_LABEL: Record<ScheduleStage, string> = {
  pending: '待派车',
  inProgress: '运输中',
  completed: '已完成',
}

function getStage(d: Dispatch): ScheduleStage {
  if (d.status === 'confirmed') return 'pending'
  if (['dispatched', 'entering', 'loading', 'leaving'].includes(d.status)) return 'inProgress'
  return 'completed' // completed / cancelled 一起
}

/** 派车调度看板 */
export function DispatchSchedulePage() {
  const { list, load, save } = useDispatchStore()
  const { vehicles, drivers, yards, loadVehicles, loadDrivers, loadCompanies, loadYards } = useDictStore()
  const companies = useDictStore((s) => s.companies)
  const [modalOpen, setModalOpen] = useState(false)
  const [active, setActive] = useState<Dispatch | null>(null)
  const [form] = Form.useForm()
  // Tab 选中：'all' | pending | inProgress | completed
  const [tab, setTab] = useState<ScheduleStage | 'all'>('pending')
  // 筛选
  const [keyword, setKeyword] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState<string | undefined>()
  const [filterYardId, setFilterYardId] = useState<string | undefined>()
  // 分页
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    load()
    loadVehicles()
    loadDrivers()
    loadCompanies()
    loadYards()
  }, [load, loadVehicles, loadDrivers, loadCompanies, loadYards])

  // —— WS 事件订阅（沉默开关） ——
  // 当前不展示任何 UI 反馈（5s 定时器 / 刷新状态均已移除），
  // 仅保留订阅入口；未来对接真实后端时只需在 ws.ts 中替换 emit 即可启用。
  useEffect(() => {
    const tick = () => {
      load()
    }
    const unsubscribe = on(WS_EVENTS.DISPATCH_UPDATE, tick)
    return unsubscribe
  }, [load])

  /** 渲染多园区：调用共享 renderYardNames */
  const renderYard = (yardIds: string[] | undefined, primaryYardId?: string) =>
    renderYardNames(yardIds, primaryYardId, yards)

  // 4 个统计卡（基于全量数据，不受 Tab/筛选影响）
  const stats = useMemo(() => ({
    pending: list.filter((d) => d.status === 'confirmed').length,
    inProgress: list.filter((d) => ['dispatched', 'entering', 'loading', 'leaving'].includes(d.status)).length,
    completed: list.filter((d) => d.status === 'completed').length,
    availableVehicles: vehicles.filter((v) => v.status === 'enabled').length,
  }), [list, vehicles])

  // 过滤（按 Tab + 关键词 + 方向 + 公司 + 园区）
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return list.filter((d) => {
      // Tab 过滤
      if (tab !== 'all' && getStage(d) !== tab) return false
      // 关键词：调车编号 / 公司名 / 司机
      if (kw) {
        const text = `${d.dispatchNo} ${d.companyName} ${d.driverName || ''}`.toLowerCase()
        if (!text.includes(kw)) return false
      }
      // 方向
      if (filterDirection && !d.direction.includes(filterDirection)) return false
      // 公司
      if (filterCompanyId && d.companyId !== filterCompanyId) return false
      // 园区（在 yardIds 列表里）
      if (filterYardId && !(d.yardIds || []).includes(filterYardId)) return false
      return true
    })
  }, [list, tab, keyword, filterDirection, filterCompanyId, filterYardId])

  // 切 Tab 时回到第 1 页
  useEffect(() => {
    setCurrentPage(1)
  }, [tab, keyword, filterDirection, filterCompanyId, filterYardId])

  // 已派车组（同公司+同方向+同时段）—— 只在"待派车"Tab 才展示
  const grouped = useMemo(() => {
    if (tab !== 'pending') return []
    const map = new Map<string, Dispatch[]>()
    filtered.forEach((d) => {
      const key = `${d.companyId}-${d.primaryYardId || (d.yardIds?.[0] ?? '')}-${d.direction}-${d.expectedLoadTime.slice(0, 13)}`
      const arr = map.get(key) || []
      arr.push(d)
      map.set(key, arr)
    })
    return Array.from(map.entries())
  }, [filtered, tab])

  const handleOpen = (record: Dispatch) => {
    setActive(record)
    form.resetFields()
    // 「重新派车」时回填之前选的车辆/司机/调车员（dispatched 状态）
    if (record.status === 'dispatched' && record.vehicleId && record.driverId) {
      form.setFieldsValue({
        vehicleId: record.vehicleId,
        driverId: record.driverId,
        dispatcherName: record.dispatcherName,
      })
    }
    setModalOpen(true)
  }

  const handleDispatch = async () => {
    if (!active) return
    try {
      const values = await form.validateFields()
      const vehicle = vehicles.find((v) => v.id === values.vehicleId)
      const driver = drivers.find((d) => d.id === values.driverId)
      await save({
        ...active,
        status: 'dispatched' as DispatchStatus,
        vehicleId: vehicle?.id,
        vehicleNo: vehicle?.plateNo,
        driverId: driver?.id,
        driverName: driver?.name,
        dispatcherName: values.dispatcherName,
        dispatchedAt: nowIsoString(),
      })
      message.success('派车成功')
      setModalOpen(false)
    } catch {
      // 校验失败
    }
  }

  // 顶部 Tab 数据条数（用于徽标）
  const tabCounts = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const filterBase = (d: Dispatch) => {
      if (kw) {
        const text = `${d.dispatchNo} ${d.companyName} ${d.driverName || ''}`.toLowerCase()
        if (!text.includes(kw)) return false
      }
      if (filterDirection && !d.direction.includes(filterDirection)) return false
      if (filterCompanyId && d.companyId !== filterCompanyId) return false
      if (filterYardId && !(d.yardIds || []).includes(filterYardId)) return false
      return true
    }
    return {
      all: list.filter(filterBase).length,
      pending: list.filter((d) => filterBase(d) && d.status === 'confirmed').length,
      inProgress: list.filter((d) => filterBase(d) && ['dispatched', 'entering', 'loading', 'leaving'].includes(d.status)).length,
      completed: list.filter((d) => filterBase(d) && d.status === 'completed').length,
    }
  }, [list, keyword, filterDirection, filterCompanyId, filterYardId])

  // 顶部筛选下拉选项
  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies],
  )
  const yardOptions = useMemo(
    () => yards.map((y) => ({ value: y.id, label: y.name })),
    [yards],
  )
  // 方向（自动从数据中提取去重）
  const directionOptions = useMemo(
    () => Array.from(new Set(list.map((d) => d.direction).filter(Boolean))).map((d) => ({ value: d, label: d })),
    [list],
  )

  return (
    <PageContainer
      title="派车调度看板"
    >
      {/* 4 个统计卡 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="待派车" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运输中" value={stats.inProgress} prefix={<TruckOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日已完成" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="可派车辆" value={stats.availableVehicles} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* 顶部筛选 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={[12, 8]}>
          <Input
            allowClear
            placeholder="调车编号 / 公司 / 司机"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="方向"
            value={filterDirection || undefined}
            onChange={(v) => setFilterDirection(v || '')}
            options={directionOptions}
            style={{ width: 140 }}
          />
          <Select
            allowClear
            placeholder="物流公司"
            value={filterCompanyId}
            onChange={setFilterCompanyId}
            options={companyOptions}
            style={{ width: 180 }}
            showSearch
            optionFilterProp="label"
          />
          <Select
            allowClear
            placeholder="园区"
            value={filterYardId}
            onChange={setFilterYardId}
            options={yardOptions}
            style={{ width: 140 }}
            showSearch
            optionFilterProp="label"
          />
          <Button
            onClick={() => {
              setKeyword('')
              setFilterDirection('')
              setFilterCompanyId(undefined)
              setFilterYardId(undefined)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* Tab 切换 + 表格 */}
      <Card>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as ScheduleStage | 'all')}
          items={[
            { key: 'all', label: `全部 (${tabCounts.all})` },
            { key: 'pending', label: `待派车 (${tabCounts.pending})` },
            { key: 'inProgress', label: `运输中 (${tabCounts.inProgress})` },
            { key: 'completed', label: `已完成 (${tabCounts.completed})` },
          ]}
        />

        {tab === 'pending' ? (
          // 待派车 Tab：拼车分组
          grouped.length === 0 ? (
            <Empty description="暂无待派车单" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {grouped.map(([key, items]) => {
                const first = items[0]
                return (
                  <Card
                    key={key}
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        <Tag color="blue">{first.companyName}</Tag>
                        <Tag>服务方向：{first.direction}</Tag>
                        <Tag color="cyan">时段：{first.expectedLoadTime.slice(0, 13)}:00</Tag>
                        {items.length > 1 && <Tag color="purple">拼车 {items.length} 单</Tag>}
                      </Space>
                    }
                  >
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={items}
                      pagination={false}
                      columns={[
                        { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
                        { title: '园区', dataIndex: 'yardIds', width: 180, render: (ids: string[] | undefined, r: Dispatch) => renderYard(ids, r.primaryYardId) },
                        { title: '货物', dataIndex: 'goods', render: (g: Dispatch['goods']) => g?.map((x) => `${x.goodsName}×${x.quantity}`).join('；') || '-' },
                        { title: '期望装货', dataIndex: 'expectedLoadTime', width: 160 },
                        { title: '创建人', dataIndex: 'creatorName', width: 100 },
                        {
                          title: '操作',
                          width: 180,
                          render: (_, r) => (
                            <Space size={4}>
                              <Button type="primary" size="small" onClick={() => handleOpen(r)}>
                                派车
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/marketing/dispatch/${r.id}`)}
                              >
                                详情
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </Card>
                )
              })}
            </Space>
          )
        ) : (
          // 其它 Tab：普通表格 + 分页
          <Table<Dispatch>
            size="small"
            rowKey="id"
            dataSource={filtered}
            locale={{ emptyText: <Empty description="暂无数据" /> }}
            pagination={{
              current: currentPage,
              pageSize,
              total: filtered.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '30', '50', '100'],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setCurrentPage(p)
                setPageSize(ps)
              },
            }}
            columns={[
              { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
              {
                title: '状态',
                dataIndex: 'status',
                width: 100,
                render: (s: DispatchStatus) => {
                  const opt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === s)
                  return <Tag color={opt?.color}>{opt?.label}</Tag>
                },
              },
              { title: '公司', dataIndex: 'companyName', width: 160, ellipsis: true },
              { title: '方向', dataIndex: 'direction', width: 100 },
              { title: '园区', dataIndex: 'yardIds', width: 180, render: (ids: string[] | undefined, r: Dispatch) => renderYard(ids, r.primaryYardId) },
              { title: '车辆', dataIndex: 'vehicleNo', width: 100 },
              { title: '司机', dataIndex: 'driverName', width: 100 },
              { title: '派车时间', dataIndex: 'dispatchedAt', width: 160 },
              { title: '完成时间', dataIndex: 'completedAt', width: 160 },
              {
                title: '操作',
                key: 'action',
                width: 180,
                fixed: 'right',
                render: (_, r) => {
                  // 终态（completed / cancelled）禁止派车
                  const canDispatch = r.status !== 'completed' && r.status !== 'cancelled'
                  return (
                    <Space size={4}>
                      <Button
                        type="primary"
                        size="small"
                        disabled={!canDispatch}
                        onClick={() => handleOpen(r)}
                      >
                        {r.status === 'dispatched' ? '重新派车' : '派车'}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/marketing/dispatch/${r.id}`)}
                      >
                        详情
                      </Button>
                    </Space>
                  )
                },
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={`派车 - ${active?.dispatchNo || ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleDispatch}
        okText="确认派车"
        width={600}
      >
        {active && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <Space wrap>
                <Tag color="blue">{active.companyName}</Tag>
                <Tag>{active.direction}</Tag>
                <Tag color="cyan">{renderYard(active.yardIds, active.primaryYardId)}</Tag>
              </Space>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item name="vehicleId" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
                <Select
                  placeholder="请选择车辆"
                  showSearch
                  optionFilterProp="label"
                  options={vehicles
                    .filter((v) => v.status === 'enabled' && (!active.companyId || v.companyId === active.companyId))
                    .map((v) => ({ value: v.id, label: `${v.plateNo}（${v.maxLoad}t / ${v.length}m）` }))}
                />
              </Form.Item>
              <Form.Item name="driverId" label="选择司机" rules={[{ required: true, message: '请选择司机' }]}>
                <Select
                  placeholder="请选择司机"
                  showSearch
                  optionFilterProp="label"
                  options={drivers
                    .filter((d) => d.status === 'enabled' && (!active.companyId || d.companyId === active.companyId))
                    .map((d) => ({ value: d.id, label: `${d.name}（${d.phone}）` }))}
                />
              </Form.Item>
              <Form.Item name="dispatcherName" label="调车员（备注）">
                <Select
                  placeholder="可选"
                  allowClear
                  options={[
                    { value: '周文', label: '周文' },
                    { value: '吴峰', label: '吴峰' },
                  ]}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </PageContainer>
  )
}
