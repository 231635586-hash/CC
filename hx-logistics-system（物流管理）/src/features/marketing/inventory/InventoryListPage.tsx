import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CarOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components'
import { useInventoryStore, useCustomerStore } from '@/stores'
import {
  INVENTORY_STATUS_LABEL,
  INVENTORY_STATUS_COLOR,
  ORDER_TYPE_LABEL,
  ORDER_TYPE_OPTIONS,
  PACKAGING_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
} from '@/types/inventory'
import type { Inventory, InventoryStatus } from '@/types/inventory'
import { InventoryFormDrawer } from './InventoryFormDrawer'
import { InventoryImportDrawer } from './InventoryImportDrawer'
import styles from './InventoryListPage.module.css'

export function InventoryListPage() {
  const navigate = useNavigate()
  const { list, loadList, removeInventory } = useInventoryStore()
  const { list: customers, loadList: loadCustomers } = useCustomerStore()
  const [searchName, setSearchName] = useState('')
  const [searchMaterial, setSearchMaterial] = useState('')
  const [searchOrderType, setSearchOrderType] = useState<string>('')
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [searchDateRange, setSearchDateRange] = useState<[string, string] | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [importDrawerOpen, setImportDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Inventory | null>(null)

  useEffect(() => {
    loadList()
    loadCustomers()
  }, [loadList, loadCustomers])

  const stats = useMemo(() => {
    return {
      total: list.length,
      inStock: list.filter((i) => i.status === 'in_stock').length,
      locked: list.filter((i) => i.status === 'locked').length,
      shipped: list.filter((i) => i.status === 'shipped').length,
    }
  }, [list])

  const filtered = useMemo(() => {
    return list.filter((i) => {
      if (searchName && !i.customerName.toLowerCase().includes(searchName.toLowerCase())) return false
      if (searchMaterial && !i.materialCode.toLowerCase().includes(searchMaterial.toLowerCase())) return false
      if (searchOrderType && i.orderType !== searchOrderType) return false
      if (searchStatus && i.status !== searchStatus) return false
      if (searchDateRange) {
        const imp = new Date(i.importDate).getTime()
        if (imp < new Date(searchDateRange[0]).getTime() || imp > new Date(searchDateRange[1]).getTime()) {
          return false
        }
      }
      return true
    })
  }, [list, searchName, searchMaterial, searchOrderType, searchStatus, searchDateRange])

  const handleAdd = () => {
    setEditing(null)
    setFormDrawerOpen(true)
  }

  const handleEdit = (record: Inventory) => {
    setEditing(record)
    setFormDrawerOpen(true)
  }

  const handleView = (record: Inventory) => {
    setEditing(record)
    setFormDrawerOpen(true)
  }

  const handleDelete = (record: Inventory) => {
    removeInventory(record.id)
    message.success('已删除')
  }

  const handleDispatch = (record: Inventory) => {
    navigate(`/marketing/dispatch?inventoryId=${record.id}`)
  }

  const resetSearch = () => {
    setSearchName('')
    setSearchMaterial('')
    setSearchOrderType('')
    setSearchStatus('')
    setSearchDateRange(null)
  }

  return (
    <PageContainer title="库存管理">
      {/* 搜索区 */}
      <div className={styles.searchRow}>
        <input className={styles.searchItem} placeholder="客户名称" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <input className={styles.searchItem} placeholder="物料编码" value={searchMaterial} onChange={(e) => setSearchMaterial(e.target.value)} />
        <select className={styles.searchItem} value={searchOrderType} onChange={(e) => setSearchOrderType(e.target.value)}>
          <option value="">全部订单类型</option>
          {ORDER_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={styles.searchItem} value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
          <option value="">全部状态</option>
          {INVENTORY_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button onClick={resetSearch}>重置</Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col span={6}><Card><Statistic title="总记录" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="已入库" value={stats.inStock} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已锁定" value={stats.locked} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已发货" value={stats.shipped} valueStyle={{ color: '#1890ff' }} /></Card></Col>
      </Row>

      {/* 操作按钮 */}
      <div className={styles.toolbar}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
        <Button icon={<FileExcelOutlined />} onClick={() => setImportDrawerOpen(true)}>批量导入</Button>
      </div>

      {/* 列表 */}
      <Table
        rowKey="id"
        dataSource={filtered}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        columns={[
          { title: '系统单号', dataIndex: 'id', width: 160 },
          { title: '条码编号', dataIndex: 'barcode', width: 150 },
          { title: '物料编码', dataIndex: 'materialCode', width: 120 },
          { title: '物料名称', dataIndex: 'materialName', width: 150, ellipsis: true },
          { title: '客户名称', dataIndex: 'customerName', width: 200, ellipsis: true },
          { title: '数量(箱)', dataIndex: 'quantity', width: 90, align: 'right' },
          {
            title: '订单类型',
            dataIndex: 'orderType',
            width: 100,
            render: (v) => ORDER_TYPE_LABEL[v as keyof typeof ORDER_TYPE_LABEL] || v,
          },
          {
            title: '库存状态',
            dataIndex: 'status',
            width: 100,
            render: (v: InventoryStatus) => (
              <Tag color={INVENTORY_STATUS_COLOR[v]}>{INVENTORY_STATUS_LABEL[v]}</Tag>
            ),
          },
          { title: '库龄(天)', dataIndex: 'age', width: 90, align: 'right', render: (v) => v ?? '-' },
          {
            title: '操作',
            width: 320,
            fixed: 'right',
            render: (_, record) => {
              const isInStock = record.status === 'in_stock'
              return (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
                    查看
                  </Button>
                  <Button type="link" size="small" icon={<EditOutlined />} disabled={!isInStock} onClick={() => handleEdit(record)}>
                    编辑
                  </Button>
                  {isInStock && (
                    <Button type="link" size="small" icon={<CarOutlined />} onClick={() => handleDispatch(record)}>
                      发起调车
                    </Button>
                  )}
                  <Popconfirm
                    title="确认删除该库存？删除后不可恢复"
                    description="仅可删除已入库状态的库存"
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(record)}
                  >
                    <Button type="link" size="small" icon={<DeleteOutlined />} danger disabled={!isInStock}>删除</Button>
                  </Popconfirm>
                </Space>
              )
            },
          },
        ]}
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />

      <InventoryFormDrawer
        open={formDrawerOpen}
        inventory={editing}
        customers={customers}
        onClose={() => setFormDrawerOpen(false)}
      />

      <InventoryImportDrawer
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        onSuccess={() => loadList()}
      />
    </PageContainer>
  )
}
