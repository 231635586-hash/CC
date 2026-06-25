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
  MATERIAL_CATEGORY_LABEL,
  STOCK_TYPE_LABEL,
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
  const [searchYard, setSearchYard] = useState<string>('')
  const [searchCategory, setSearchCategory] = useState<string>('')
  const [searchStockType, setSearchStockType] = useState<string>('')
  const [searchOrderType, setSearchOrderType] = useState<string>('')
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [searchSalesPerson, setSearchSalesPerson] = useState<string>('')
  const [searchDateRange, setSearchDateRange] = useState<[string, string] | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [importDrawerOpen, setImportDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Inventory | null>(null)

  useEffect(() => {
    loadList()
    loadCustomers()
  }, [loadList, loadCustomers])

  // 园区下拉选项（从数据中动态提取）
  const yardOptions = useMemo(() => {
    const set = new Set<string>()
    list.forEach((i) => i.yardName && set.add(i.yardName))
    return Array.from(set)
  }, [list])

  // 业务员下拉选项（从数据中动态提取）
  const salesPersonOptions = useMemo(() => {
    const set = new Set<string>()
    list.forEach((i) => i.salesPersonName && set.add(i.salesPersonName))
    return Array.from(set)
  }, [list])

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
      if (searchYard && i.yardName !== searchYard) return false
      if (searchCategory && i.category !== searchCategory) return false
      if (searchStockType && i.stockType !== searchStockType) return false
      if (searchOrderType && i.orderType !== searchOrderType) return false
      if (searchStatus && i.status !== searchStatus) return false
      if (searchSalesPerson && i.salesPersonName !== searchSalesPerson) return false
      if (searchDateRange) {
        const imp = new Date(i.importDate).getTime()
        if (imp < new Date(searchDateRange[0]).getTime() || imp > new Date(searchDateRange[1]).getTime()) {
          return false
        }
      }
      return true
    })
  }, [list, searchName, searchMaterial, searchYard, searchCategory, searchStockType, searchOrderType, searchStatus, searchSalesPerson, searchDateRange])

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
    setSearchYard('')
    setSearchCategory('')
    setSearchStockType('')
    setSearchOrderType('')
    setSearchStatus('')
    setSearchSalesPerson('')
    setSearchDateRange(null)
  }

  return (
    <PageContainer title="库存管理">
      {/* 搜索区 */}
      <div className={styles.searchRow}>
        <input className={styles.searchItem} placeholder="客户名称" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <input className={styles.searchItem} placeholder="物料编码" value={searchMaterial} onChange={(e) => setSearchMaterial(e.target.value)} />
        <select className={styles.searchItem} value={searchYard} onChange={(e) => setSearchYard(e.target.value)}>
          <option value="">全部归属</option>
          {yardOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className={styles.searchItem} value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
          <option value="">全部类别</option>
          <option value="rough">毛坯</option>
          <option value="processed">加工件</option>
        </select>
        <select className={styles.searchItem} value={searchStockType} onChange={(e) => setSearchStockType(e.target.value)}>
          <option value="">全部现货</option>
          <option value="in_stock_now">现货</option>
          <option value="waiting">等货</option>
        </select>
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
        <select className={styles.searchItem} value={searchSalesPerson} onChange={(e) => setSearchSalesPerson(e.target.value)}>
          <option value="">全部业务员</option>
          {salesPersonOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
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
          { title: '系统单号', dataIndex: 'id', width: 150 },
          {
            title: '归属',
            dataIndex: 'yardName',
            width: 80,
            render: (v: string | undefined) => v ? <Tag color="blue">{v}</Tag> : '-',
          },
          {
            title: '类别',
            dataIndex: 'category',
            width: 80,
            render: (v: Inventory['category']) => v ? MATERIAL_CATEGORY_LABEL[v] : '-',
          },
          { title: '物料编码', dataIndex: 'materialCode', width: 110 },
          { title: '产品名称', dataIndex: 'productName', width: 150, ellipsis: true },
          { title: '客户', dataIndex: 'customerName', width: 180, ellipsis: true },
          {
            title: '业务员',
            dataIndex: 'salesPersonName',
            width: 90,
            render: (v: string | undefined) => v || '-',
          },
          {
            title: '发货地',
            dataIndex: 'shippingFrom',
            width: 90,
            render: (v: string | undefined) => v || '-',
          },
          {
            title: '数量',
            dataIndex: 'quantity',
            width: 110,
            align: 'right',
            render: (q: number, r: Inventory) => {
              const per = r.quantityPerBox ?? '-'
              return (
                <span>
                  {q} 箱
                  {r.totalQuantity !== undefined && (
                    <span style={{ color: '#999', fontSize: 12 }}> / {r.totalQuantity} 件</span>
                  )}
                </span>
              )
            },
          },
          {
            title: '净重(kg)',
            dataIndex: 'netWeight',
            width: 90,
            align: 'right',
            render: (v: number | undefined) => (v ?? '-'),
          },
          {
            title: '现货',
            dataIndex: 'stockType',
            width: 80,
            render: (v: Inventory['stockType']) =>
              v ? (
                <Tag color={v === 'in_stock_now' ? 'green' : 'orange'}>
                  {STOCK_TYPE_LABEL[v]}
                </Tag>
              ) : '-',
          },
          {
            title: '订单类型',
            dataIndex: 'orderType',
            width: 100,
            render: (v) => ORDER_TYPE_LABEL[v as keyof typeof ORDER_TYPE_LABEL] || v,
          },
          {
            title: '库存状态',
            dataIndex: 'status',
            width: 90,
            render: (v: InventoryStatus) => (
              <Tag color={INVENTORY_STATUS_COLOR[v]}>{INVENTORY_STATUS_LABEL[v]}</Tag>
            ),
          },
          { title: '库龄(天)', dataIndex: 'age', width: 80, align: 'right', render: (v) => v ?? '-' },
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
        scroll={{ x: 1840 }}
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