import { useEffect, useState, useMemo } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, AutoComplete } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer, SearchForm, Empty } from '@/components'
import { useDispatchStore, useDictStore, useAuthStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import { parseCities } from '@/utils'
import type { Dispatch } from '@/types/dispatch'
import { DispatchFormDrawer } from './DispatchFormDrawer'

/** 调车单列表页 */
export function DispatchListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list, load, save, remove, loading } = useDispatchStore()
  const { loadCompanies, loadYards, yards } = useDictStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Dispatch | null>(null)
  const [linkedInventoryIds, setLinkedInventoryIds] = useState<string[] | null>(null)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    load()
    loadCompanies()
    loadYards()
  }, [load, loadCompanies, loadYards])

  /**
   * 渲染园区名称：优先按 yardId 实时查 yards 字典
   * 这是 UI 层兜底，无论 store 中的 yardName 字段是什么值（即使是旧的"华翔上海/苏州园区"），
   * 都能通过 yardId 实时匹配当前 yards 字典返回正确名称
   */
  const renderYardName = (yardId: string, fallback: string) => {
    const hit = yards.find((y) => y.id === yardId)
    if (hit) return hit.name
    return fallback || '-'
  }

  // 从 URL 参数识别"库存关联"入口（支持多 ID：?inventoryId=A&inventoryId=B）
  useEffect(() => {
    const ids = searchParams.getAll('inventoryId')
    if (ids.length) {
      setLinkedInventoryIds(ids)
      setEditing(null)
      setDrawerOpen(true)
    }
  }, [searchParams])

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setLinkedInventoryIds(null)
    if (searchParams.has('inventoryId')) {
      setSearchParams({})
    }
  }

  const handleEdit = (record: Dispatch) => {
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    message.success('删除成功')
  }

  const handleConfirm = async (record: Dispatch) => {
    await save({ ...record, status: 'confirmed' as DispatchStatus, confirmedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
    message.success('已确认')
  }

  const handleCancel = async (record: Dispatch) => {
    await save({ ...record, status: 'cancelled' as DispatchStatus })
    message.success('已取消')
  }

  // 筛选
  const filtered = list.filter((d) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (
        !d.dispatchNo.toLowerCase().includes(kw) &&
        !d.companyName.toLowerCase().includes(kw) &&
        !d.yardName.toLowerCase().includes(kw)
      )
        return false
    }
    if (filters.status && d.status !== filters.status) return false
    if (filters.direction && !parseCities(d.direction).includes(filters.direction as string)) return false
    if (filters.yardId && d.yardId !== filters.yardId) return false
    return true
  })

  // 收集所有出现过的方向城市（用于搜索 AutoComplete）
  const directionOptions = useMemo(() => {
    return Array.from(
      new Set(list.flatMap((d) => parseCities(d.direction))),
    ).map((c) => ({ value: c }))
  }, [list])

  return (
    <PageContainer
      title="调车单管理"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              setDrawerOpen(true)
            }}
          >
            新建调车单
          </Button>
        </Space>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '关键词', type: 'input', placeholder: '编号/公司/园区' },
          {
            name: 'status',
            label: '状态',
            type: 'select',
            options: DISPATCH_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
        onSearch={setFilters}
      />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#666' }}>方向：</span>
        <AutoComplete
          style={{ width: 220 }}
          placeholder="输入城市，如：杭州"
          allowClear
          value={(filters.direction as string) || ''}
          options={directionOptions}
          onChange={(v) => setFilters((prev) => ({ ...prev, direction: v || '' }))}
          filterOption={(input, option) =>
            (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Table<Dispatch>
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        locale={{ emptyText: <Empty description="暂无调车单" /> }}
        columns={[
          { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s: DispatchStatus) => {
              const opt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === s)
              return <Tag color={opt?.color}>{opt?.label || s}</Tag>
            },
          },
          {
            title: '服务方向',
            dataIndex: 'direction',
            width: 110,
            ellipsis: true,
            render: (d: string) => d || '-',
          },
          { title: '物流公司', dataIndex: 'companyName', width: 180 },
          {
            title: '园区',
            dataIndex: 'yardId',
            width: 140,
            render: (yardId: string, r) => renderYardName(yardId, r.yardName),
          },
          {
            title: '货物',
            dataIndex: 'goods',
            width: 220,
            render: (goods: Dispatch['goods']) => {
              if (!goods?.length) return '-'
              if (goods.length === 1) return `${goods[0].goodsName} × ${goods[0].quantity}${goods[0].unit}`
              return (
                <Tooltip title={goods.map((g) => `${g.goodsName} × ${g.quantity}${g.unit}`).join('；')}>
                  <Tag color="blue">拼车 {goods.length} 单</Tag>
                </Tooltip>
              )
            },
          },
          { title: '期望装货时间', dataIndex: 'expectedLoadTime', width: 160 },
          { title: '创建人', dataIndex: 'creatorName', width: 100 },
          {
            title: '操作',
            fixed: 'right',
            width: 240,
            render: (_, r) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/marketing/dispatch/${r.id}`)}
                >
                  详情
                </Button>
                {r.status === 'pending_confirm' && (
                  <>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleConfirm(r)}
                    >
                      确认
                    </Button>
                    <Popconfirm title="确定取消该调车单？" onConfirm={() => handleCancel(r)}>
                      <Button type="link" size="small" danger icon={<CloseOutlined />}>
                        取消
                      </Button>
                    </Popconfirm>
                  </>
                )}
                {r.status === 'draft' && (
                  <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
        scroll={{ x: 1300 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <DispatchFormDrawer
        open={drawerOpen}
        dispatch={editing}
        linkedInventoryIds={linkedInventoryIds || undefined}
        onClose={handleCloseDrawer}
      />
    </PageContainer>
  )
}
