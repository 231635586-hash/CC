import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer, SearchForm, Empty } from '@/components'
import { useDispatchStore, useDictStore, useAuthStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import { DIRECTION_LABEL } from '@/utils'
import type { Dispatch } from '@/types/dispatch'
import { DispatchFormDrawer } from './DispatchFormDrawer'

/** 调车单列表页 */
export function DispatchListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list, load, save, remove, loading } = useDispatchStore()
  const { loadCompanies, loadYards } = useDictStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Dispatch | null>(null)
  const [linkedInventoryId, setLinkedInventoryId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    load()
    loadCompanies()
    loadYards()
  }, [load, loadCompanies, loadYards])

  // 从 URL 参数识别"库存关联"入口
  useEffect(() => {
    const invId = searchParams.get('inventoryId')
    if (invId) {
      setLinkedInventoryId(invId)
      setEditing(null)
      setDrawerOpen(true)
    }
  }, [searchParams])

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setLinkedInventoryId(null)
    if (searchParams.get('inventoryId')) {
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
    if (filters.direction && d.direction !== filters.direction) return false
    if (filters.yardId && d.yardId !== filters.yardId) return false
    return true
  })

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
          {
            name: 'direction',
            label: '方向',
            type: 'select',
            options: Object.entries(DIRECTION_LABEL).map(([v, l]) => ({ value: v, label: l })),
          },
        ]}
        onSearch={setFilters}
      />

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
            title: '方向',
            dataIndex: 'direction',
            width: 70,
            render: (d: string) => DIRECTION_LABEL[d] || d,
          },
          { title: '物流公司', dataIndex: 'companyName', width: 180 },
          { title: '园区', dataIndex: 'yardName', width: 140 },
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
        linkedInventoryId={linkedInventoryId}
        onClose={handleCloseDrawer}
      />
    </PageContainer>
  )
}
