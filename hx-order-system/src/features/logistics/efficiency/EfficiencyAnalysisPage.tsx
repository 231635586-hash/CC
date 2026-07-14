import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Empty,
  Tooltip,
  Select,
  DatePicker,
  Tabs,
} from 'antd'
import {
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  ScheduleOutlined,
  InboxOutlined,
  ExportOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { PageContainer, SCROLL_PRESETS } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import type { Dispatch } from '@/types/dispatch'
import {
  analyzeDispatchEfficiency,
  formatMinutesAsHour,
  calcOnTimeArrivalRate,
  calcOnTimeLoadingRate,
  calcOnTimeDeliveryRate,
  calcFunnelCounts,
  buildYardComparisonRows,
} from '@/utils/efficiencyAnalysis'
import type { YardComparisonRow } from '@/utils/efficiencyAnalysis'
import { FunnelCountCards, type FunnelCardSpec } from './components/FunnelCountCards'
import {
  exportDispatchEfficiency,
  buildYardLookup,
  buildDispatchLookup,
} from '@/utils/excelExport'
import type { GroupRowForExport } from '@/utils/excelExport'
import type { DispatchEfficiency } from '@/types/dispatch'
import { SHIPPING_METHOD_LABEL } from '@/types/dispatch'

const { RangePicker } = DatePicker

/** 调度时效分析列表页（v0.6.0-M2.4 业务视角：3 比率 + 5 漏斗 + 1 图表 + 4 Tab 分组）
 *
 * 比率卡：及时到场率 / 及时装货完成率(标准4小时) / 及时到货率
 * 漏斗卡：需求到场 / 实际到场 / 已装完 / 已出场 / 已到货（绝对数）
 * 图表  ：园区时效对比柱状图（4 系列 × N 园区）
 * 5 筛选：时间范围（近 30 天默认） / 运输方向 / 发运方式 / 物流公司 / 装货园区
 * 4 Tab：调车单明细 / 按公司 / 按园区 / 按方向 排名榜
 */
export function EfficiencyAnalysisPage() {
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { companies, yards, loadCompanies, loadYards } = useDictStore()

  // 默认时间范围：近 30 天
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [selectedDirections, setSelectedDirections] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [selectedYardIds, setSelectedYardIds] = useState<string[]>([])

  useEffect(() => {
    load()
    loadCompanies()
    loadYards()
  }, [load, loadCompanies, loadYards])

  // 选项字典
  const directionOptions = useMemo(() => {
    const set = new Set(list.map((d) => d.direction).filter(Boolean))
    return Array.from(set).map((v) => ({ label: v, value: v }))
  }, [list])
  const methodOptions = useMemo(
    () =>
      (Object.keys(SHIPPING_METHOD_LABEL) as Array<keyof typeof SHIPPING_METHOD_LABEL>).map(
        (k) => ({ label: SHIPPING_METHOD_LABEL[k], value: k }),
      ),
    [],
  )
  const companyOptions = useMemo(
    () => companies.map((c) => ({ label: c.name, value: c.id })),
    [companies],
  )
  const yardOptions = useMemo(
    () => yards.map((y) => ({ label: y.name, value: y.id })),
    [yards],
  )

  // 1) 按 5 维筛选 dispatch（含未完成，用于 KPI 卡分母）
  const filteredDispatches = useMemo(() => {
    const [from, to] = timeRange
    return list.filter((d) => {
      if (!d.expectedLoadTime) return false
      const t = dayjs(d.expectedLoadTime)
      if (t.isBefore(from) || t.isAfter(to)) return false
      if (selectedDirections.length > 0 && !selectedDirections.includes(d.direction))
        return false
      if (selectedMethods.length > 0 && !selectedMethods.includes(d.shippingMethod))
        return false
      if (selectedCompanyIds.length > 0 && !selectedCompanyIds.includes(d.companyId))
        return false
      if (selectedYardIds.length > 0) {
        const hit = d.yardIds?.some((y) => selectedYardIds.includes(y))
        if (!hit) return false
      }
      return true
    })
  }, [list, timeRange, selectedDirections, selectedMethods, selectedCompanyIds, selectedYardIds])

  // 2) 仅取 status=completed 跑分析
  const analyses = useMemo<DispatchEfficiency[]>(() => {
    const result: DispatchEfficiency[] = []
    for (const d of filteredDispatches) {
      if (d.status !== 'completed') continue
      const a = analyzeDispatchEfficiency(d)
      if (a) result.push(a)
    }
    return result
  }, [filteredDispatches])

  // 3) 3 指标卡（v0.4.0-M2.3 改造：5 指标 → 3 指标，业务视角）
  const stats = useMemo(() => {
    const arrival = calcOnTimeArrivalRate(filteredDispatches)
    const loading = calcOnTimeLoadingRate(filteredDispatches)
    const delivery = calcOnTimeDeliveryRate(filteredDispatches)
    return {
      arrival,
      loading,
      delivery,
    }
  }, [filteredDispatches])

  // 3.5) 5 漏斗计数卡（v0.6.0-M2.4 增量：绝对数漏斗）
  const funnelCounts = useMemo(
    () => calcFunnelCounts(filteredDispatches, timeRange),
    [filteredDispatches, timeRange],
  )

  // 3.6) 园区对比图表数据（4 系列 × N 园区）
  const yardChartRows = useMemo<YardComparisonRow[]>(
    () => buildYardComparisonRows({ dispatches: filteredDispatches, analyses, yards }),
    [filteredDispatches, analyses, yards],
  )

  // 4) Tab 分组聚合
  const groupedByCompany = useMemo(
    () => groupAggregates(analyses, (a) => a.companyName),
    [analyses],
  )
  const groupedByYard = useMemo(
    () =>
      groupAggregates(analyses, (a) => {
        const names = a.yardIds
          .map((id) => yards.find((y) => y.id === id)?.name || id)
          .join('、')
        return names || '-'
      }),
    [analyses, yards],
  )
  const groupedByDirection = useMemo(
    () => groupAggregates(analyses, (a) => a.direction || '-'),
    [analyses],
  )

  // 5) 导出工具所需的 Lookup（避免导出时再次穿透 store）
  const yardLookup = useMemo(() => buildYardLookup(yards), [yards])
  const dispatchLookup = useMemo(() => buildDispatchLookup(list), [list])

  /** 触发 Excel 导出（4 Sheet：明细 + 3 个分组 Tab） */
  const handleExport = () => {
    exportDispatchEfficiency({
      analyses,
      groupedByCompany,
      groupedByYard,
      groupedByDirection,
      dispatchLookup,
      yardLookup,
    })
  }

  return (
    <PageContainer
      title="调度时效分析"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={analyses.length === 0}
          >
            导出 Excel
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            手动刷新
          </Button>
        </Space>
      }
    >
      {/* 5 筛选条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Space>
              <span style={{ color: '#666' }}>时间范围：</span>
              <RangePicker
                value={timeRange}
                onChange={(v) => v && v[0] && v[1] && setTimeRange([v[0], v[1]])}
                presets={[
                  { label: '近 7 天', value: [dayjs().subtract(7, 'day'), dayjs()] },
                  { label: '近 30 天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                  { label: '近 90 天', value: [dayjs().subtract(90, 'day'), dayjs()] },
                ]}
                style={{ width: 260 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666' }}>运输方向：</span>
              <Select
                mode="multiple"
                allowClear
                placeholder="全部"
                options={directionOptions}
                value={selectedDirections}
                onChange={setSelectedDirections}
                style={{ minWidth: 180 }}
                maxTagCount="responsive"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666' }}>发运方式：</span>
              <Select
                mode="multiple"
                allowClear
                placeholder="全部"
                options={methodOptions}
                value={selectedMethods}
                onChange={setSelectedMethods}
                style={{ minWidth: 180 }}
                maxTagCount="responsive"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666' }}>物流公司：</span>
              <Select
                mode="multiple"
                allowClear
                placeholder="全部"
                options={companyOptions}
                value={selectedCompanyIds}
                onChange={setSelectedCompanyIds}
                style={{ minWidth: 200 }}
                maxTagCount="responsive"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666' }}>装货园区：</span>
              <Select
                mode="multiple"
                allowClear
                placeholder="全部"
                options={yardOptions}
                value={selectedYardIds}
                onChange={setSelectedYardIds}
                style={{ minWidth: 200 }}
                maxTagCount="responsive"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3 统计卡（v0.4.0-M2.3 改造：业务视角，公式 + 分子 + 分母 + 百分比） */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="及时到场率"
              value={`${stats.arrival.rate}%`}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: stats.arrival.rate >= 80 ? '#52c41a' : '#fa8c16' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              公式:按时到场车辆 / 需求到场车辆
            </div>
            <Tooltip title="分母 = 所有被派车辆(含未到场的 queued 等 8 种被派状态)">
              <div style={{ fontSize: 12, color: '#999' }}>
                分母 = {stats.arrival.denominator}（按时 {stats.arrival.numerator}）
              </div>
            </Tooltip>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="及时装货完成率（标准4小时）"
              value={`${stats.loading.rate}%`}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: stats.loading.rate >= 80 ? '#52c41a' : '#fa8c16' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              公式:装货完成时间小于4小时的 / 已装货物完成数量
            </div>
            <Tooltip title="分母 = 已装货完成的所有园区(以 YardTimeline 为单位,多园区调车单每个园区独立计数)">
              <div style={{ fontSize: 12, color: '#999' }}>
                分母 = {stats.loading.denominator}（&lt;4h {stats.loading.numerator}）
              </div>
            </Tooltip>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="及时到货率"
              value={`${stats.delivery.rate}%`}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: stats.delivery.rate >= 80 ? '#52c41a' : '#fa8c16' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              公式:及时到货的车辆 / 需求到场车辆
            </div>
            <Tooltip title="分母 = 所有被派车辆(含未到货的 in_transit/driver_confirmed)">
              <div style={{ fontSize: 12, color: '#999' }}>
                分母 = {stats.delivery.denominator}（及时 {stats.delivery.numerator}）
              </div>
            </Tooltip>
          </Card>
        </Col>
      </Row>

      {/* 5 漏斗计数卡（v0.6.0-M2.4 增量） */}
      <div style={{ marginBottom: 16 }}>
        <FunnelCountCards cards={buildFunnelCards(funnelCounts)} />
      </div>

      {/* Tab 分组明细 */}
      <Card>
        <Tabs
          defaultActiveKey="detail"
          items={[
            {
              key: 'detail',
              label: '调车单明细',
              children: (
                <Table<DispatchEfficiency>
                  rowKey="dispatchId"
                  dataSource={analyses}
                  locale={{ emptyText: <Empty description="暂无已完成调车单数据" /> }}
                  columns={[
                    {
                      title: '调车编号',
                      dataIndex: 'dispatchNo',
                      width: 150,
                      fixed: 'left',
                      render: (no: string, r) => (
                        <a onClick={() => navigate(`/logistics/efficiency/${r.dispatchId}`)}>
                          {no}
                        </a>
                      ),
                    },
                    { title: '方向', dataIndex: 'direction', width: 80 },
                    { title: '公司', dataIndex: 'companyName', width: 200, ellipsis: true },
                    {
                      title: '及时到场',
                      dataIndex: 'isOnTimeArrival',
                      width: 110,
                      render: (on: boolean, r) => {
                        if (r.arrivalDiffMin === undefined) return '-'
                        return on ? (
                          <Tag color="green">及时</Tag>
                        ) : (
                          <Tag color="red">+{r.arrivalDiffMin}min</Tag>
                        )
                      },
                    },
                    {
                      title: '及时到货',
                      dataIndex: 'isOnTimeDelivery',
                      width: 130,
                      render: (on: boolean | undefined, r) => {
                        const dispatch = dispatchLookup[r.dispatchId]
                        const anyConfirmed = dispatch?.yardTimelines?.some(
                          (y) => y.driverConfirmedAt,
                        )
                        if (!anyConfirmed) return <Tag>未到货</Tag>
                        if (on === undefined) return '-'
                        return on ? (
                          <Tag color="green">及时</Tag>
                        ) : (
                          <Tag color="red">超 SLA</Tag>
                        )
                      },
                    },
                    {
                      title: '总装货用时',
                      dataIndex: 'totalEffectiveLoadMin',
                      width: 110,
                      render: (min: number) => (
                        <span style={{ fontWeight: 500 }}>{formatMinutesAsHour(min)}</span>
                      ),
                    },
                    {
                      title: '操作',
                      fixed: 'right',
                      width: 80,
                      render: (_, r) => (
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/logistics/efficiency/${r.dispatchId}`)}
                        >
                          详情
                        </Button>
                      ),
                    },
                  ]}
                  scroll={{ x: SCROLL_PRESETS.narrow }}
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                />
              ),
            },
            {
              key: 'company',
              label: `按公司（${groupedByCompany.length}）`,
              children: <GroupRankingTable rows={groupedByCompany} />,
            },
            {
              key: 'yard',
              label: `按装货园区（${groupedByYard.length}）`,
              children: <GroupRankingTable rows={groupedByYard} />,
            },
            {
              key: 'direction',
              label: `按运输方向（${groupedByDirection.length}）`,
              children: <GroupRankingTable rows={groupedByDirection} />,
            },
          ]}
        />
      </Card>
    </PageContainer>
  )
}

// —— 分组聚合类型 ——
type GroupRow = GroupRowForExport

function groupAggregates(
  rows: DispatchEfficiency[],
  keyFn: (a: DispatchEfficiency) => string,
): GroupRow[] {
  const map = new Map<string, DispatchEfficiency[]>()
  for (const a of rows) {
    const k = keyFn(a)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(a)
  }
  const out: GroupRow[] = []
  for (const [name, arr] of map.entries()) {
    const total = arr.length
    const aDenom = arr.filter((x) => x.arrivalDiffMin !== undefined).length
    const aNum = arr.filter((x) => x.isOnTimeArrival).length
    const dDenom = arr.filter((x) => x.signedAt).length
    const dNum = arr.filter((x) => x.isOnTimeDelivery).length
    out.push({
      key: name,
      name,
      total,
      onTimeArrivalRate: aDenom > 0 ? Math.round((aNum / aDenom) * 100) : 0,
      onTimeArrivalDenom: aDenom,
      onTimeDeliveryRate: dDenom > 0 ? Math.round((dNum / dDenom) * 100) : 0,
      onTimeDeliveryDenom: dDenom,
    })
  }
  // 按及时到货率倒序
  return out.sort((a, b) => b.onTimeDeliveryRate - a.onTimeDeliveryRate)
}

function GroupRankingTable({ rows }: { rows: GroupRow[] }) {
  return (
    <Table<GroupRow>
      rowKey="key"
      dataSource={rows}
      pagination={false}
      locale={{ emptyText: <Empty description="暂无数据" /> }}
      columns={[
        { title: '排名', key: 'rank', width: 70, render: (_, __, i) => `${i + 1}` },
        { title: '分组', dataIndex: 'name', width: 280, ellipsis: true },
        { title: '总单数', dataIndex: 'total', width: 90, align: 'center' },
        {
          title: '及时到场率',
          key: 'arrival',
          width: 150,
          render: (_, r) => (
            <Tag color={r.onTimeArrivalRate >= 80 ? 'green' : 'orange'}>
              {r.onTimeArrivalRate}%（{r.onTimeArrivalDenom}）
            </Tag>
          ),
        },
        {
          title: '及时到货率',
          key: 'delivery',
          width: 170,
          render: (_, r) => (
            <Tag color={r.onTimeDeliveryRate >= 80 ? 'green' : 'red'}>
              {r.onTimeDeliveryRate}%（{r.onTimeDeliveryDenom}）
            </Tag>
          ),
        },
      ]}
    />
  )
}

/**
 * 构造 5 漏斗卡 spec（顺序固定，公式按用户原话）
 * 配色梯度：紫(需求)→蓝(实际)→青(装完)→绿(出场)→橙(到货)
 */
function buildFunnelCards(c: ReturnType<typeof calcFunnelCounts>): [FunnelCardSpec, FunnelCardSpec, FunnelCardSpec, FunnelCardSpec, FunnelCardSpec] {
  return [
    {
      key: 'expected',
      title: '需求到场',
      value: c.expected,
      formula: '需求时间在目标时间内车辆总数',
      tooltip: 'dispatch.expectedLoadTime ∈ 筛选时间范围',
      icon: <ScheduleOutlined />,
      color: '#722ed1',
    },
    {
      key: 'arrived',
      title: '实际到场',
      value: c.arrived,
      formula: '排队时间在目标时间内车辆总数',
      tooltip: '任一 YardTimeline.queuedAt ∈ 筛选时间范围',
      icon: <EnvironmentOutlined />,
      color: '#1677ff',
    },
    {
      key: 'loaded',
      title: '已装完',
      value: c.loaded,
      formula: '装货完成时间在目标时间内车辆总数',
      tooltip: '任一 YardTimeline.loadingCompletedAt ∈ 筛选时间范围',
      icon: <InboxOutlined />,
      color: '#13c2c2',
    },
    {
      key: 'exited',
      title: '已出场',
      value: c.exited,
      formula: '出场时间在目标时间内车辆总数',
      tooltip: '任一 YardTimeline.leftAt ∈ 筛选时间范围',
      icon: <ExportOutlined />,
      color: '#52c41a',
    },
    {
      key: 'delivered',
      title: '已到货',
      value: c.delivered,
      formula: '到货时间在目标时间内车辆总数',
      tooltip: '任一 YardTimeline.driverConfirmedAt ∈ 筛选时间范围',
      icon: <CheckCircleOutlined />,
      color: '#fa8c16',
    },
  ]
}
