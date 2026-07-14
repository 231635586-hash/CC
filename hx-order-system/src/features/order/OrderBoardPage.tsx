import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Tag, Space, Input, Select, Button, Empty, Badge } from 'antd'
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { PageContainer, renderYardNames, StatusTag, DISPATCH_STATUS_MAP, BoolTags } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import type { Dispatch } from '@/types/dispatch'
import { ORDER_BOARD_COLUMNS, ORDER_STATUS_OPTIONS, type OrderStatus } from '@/types/order'
import { deriveOrderStatus } from '@/utils/orderStatus'
import { formatDateTime } from '@/utils'

/**
 * 订单工作台（看板）—— 订单逻辑的主入口
 *
 * 部门逻辑 → 订单逻辑的核心呈现：把散落在营销/物流/库房的调车单，
 * 按「订单主状态」聚合成 4 列看板（待受理 / 调度中 / 履约中 / 已完成），
 * 让四个部门在同一视图协作。点击订单卡进入统一订单详情页推进状态。
 *
 * 数据源直接复用 useDispatchStore，不改动数据结构。
 */
export function OrderBoardPage() {
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { yards, companies, loadYards, loadCompanies } = useDictStore()
  const [keyword, setKeyword] = useState('')
  const [filterDirection, setFilterDirection] = useState<string | undefined>()
  const [filterCompanyId, setFilterCompanyId] = useState<string | undefined>()

  useEffect(() => {
    load()
    loadYards()
    loadCompanies()
  }, [load, loadYards, loadCompanies])

  // 筛选（关键词 / 方向 / 公司）
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return list.filter((d) => {
      if (kw) {
        const text = `${d.dispatchNo} ${d.companyName} ${d.direction} ${d.driverName || ''}`.toLowerCase()
        if (!text.includes(kw)) return false
      }
      if (filterDirection && !d.direction.includes(filterDirection)) return false
      if (filterCompanyId && d.companyId !== filterCompanyId) return false
      return true
    })
  }, [list, keyword, filterDirection, filterCompanyId])

  // 按订单主状态分组
  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Dispatch[]> = {
      pending_accept: [], scheduling: [], fulfilling: [], completed: [], cancelled: [], draft: [],
    }
    filtered.forEach((d) => {
      map[deriveOrderStatus(d)].push(d)
    })
    return map
  }, [filtered])

  const directionOptions = useMemo(
    () => Array.from(new Set(list.map((d) => d.direction).filter(Boolean))).map((v) => ({ value: v, label: v })),
    [list],
  )
  const companyOptions = useMemo(() => companies.map((c) => ({ value: c.id, label: c.name })), [companies])

  const goodsSummary = (d: Dispatch) =>
    d.goods?.map((g) => `${g.goodsName}×${g.quantity}`).join('，') || '无货物'

  return (
    <PageContainer title="订单工作台">
      {/* 顶部筛选 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={[12, 8]}>
          <Input
            allowClear
            placeholder="订单号 / 公司 / 方向 / 司机"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="服务方向"
            value={filterDirection}
            onChange={setFilterDirection}
            options={directionOptions}
            style={{ width: 140 }}
          />
          <Select
            allowClear
            placeholder="物流公司"
            value={filterCompanyId}
            onChange={setFilterCompanyId}
            options={companyOptions}
            style={{ width: 200 }}
            showSearch
            optionFilterProp="label"
          />
          <Button
            onClick={() => {
              setKeyword('')
              setFilterDirection(undefined)
              setFilterCompanyId(undefined)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* 4 列看板 */}
      <Row gutter={12} align="top">
        {ORDER_BOARD_COLUMNS.map((col) => {
          const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === col)!
          const items = grouped[col]
          return (
            <Col key={col} span={6}>
              <Card
                size="small"
                styles={{ body: { padding: 8, background: '#f5f6f8', minHeight: 'calc(100vh - 260px)' } }}
                title={
                  <Space>
                    <span>{opt.emoji}</span>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    <Badge count={items.length} showZero color={opt.color} />
                  </Space>
                }
                extra={<span style={{ fontSize: 12, color: '#999' }}>{opt.dept}</span>}
              >
                {items.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单" style={{ marginTop: 40 }} />
                ) : (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {items.map((d) => (
                      <Card
                        key={d.id}
                        size="small"
                        hoverable
                        styles={{ body: { padding: 10 } }}
                        onClick={() => navigate(`/orders/${d.id}`)}
                      >
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontWeight: 600 }}>{d.dispatchNo}</span>
                          <StatusTag value={d.status} map={DISPATCH_STATUS_MAP} />
                        </Space>
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <Space size={4} wrap>
                            <EnvironmentOutlined style={{ color: '#1677ff' }} />
                            <span>{d.direction || '-'}</span>
                            <BoolTags isUrgent={d.isUrgent} isCarpool={d.isCarpool} />
                          </Space>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>{d.companyName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                          园区：{renderYardNames(d.yardIds, d.primaryYardId, yards)}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#999' }} title={goodsSummary(d)}>
                          货物：{goodsSummary(d)}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                          期望装货：{formatDateTime(d.expectedLoadTime)}
                        </div>
                        {d.vehicleNo && (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                            车 / 人：{d.vehicleNo} / {d.driverName || '-'}
                          </div>
                        )}
                      </Card>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          )
        })}
      </Row>
    </PageContainer>
  )
}
