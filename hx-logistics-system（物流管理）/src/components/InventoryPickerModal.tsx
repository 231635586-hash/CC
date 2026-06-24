import { useEffect, useMemo, useState } from 'react'
import { Modal, Table, Input, Tag, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { useInventoryStore } from '@/stores'
import { Empty } from './Empty'
import {
  PACKAGING_LABEL,
  ORDER_TYPE_LABEL,
  MATERIAL_CATEGORY_LABEL,
  STOCK_TYPE_LABEL,
} from '@/types/inventory'
import type { Inventory } from '@/types/inventory'

interface Props {
  open: boolean
  /** 已选中的库存 id 列表（会被排除） */
  excludeIds: string[]
  onClose: () => void
  onConfirm: (selectedIds: string[]) => void
}

/**
 * 库存选择 Modal（多选）
 * - 仅展示 status === 'in_stock' 且未被 excludeIds 排除的库存
 * - 顶部搜索（系统单号/物料编码/物料名称/客户名称）
 * - 表格多选 + 确认回调
 */
export function InventoryPickerModal({ open, excludeIds, onClose, onConfirm }: Props) {
  const { list, loadList } = useInventoryStore()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    if (open) {
      loadList()
      setSelectedRowKeys([])
      setKeyword('')
    }
  }, [open, loadList])

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds])

  const candidates = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return list.filter((i) => {
      if (i.status !== 'in_stock') return false
      if (excludeSet.has(i.id)) return false
      if (!kw) return true
      return (
        i.id.toLowerCase().includes(kw) ||
        i.materialCode.toLowerCase().includes(kw) ||
        i.materialName.toLowerCase().includes(kw) ||
        i.customerName.toLowerCase().includes(kw)
      )
    })
  }, [list, excludeSet, keyword])

  const columns: ColumnsType<Inventory> = [
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
    { title: '客户', dataIndex: 'customerName', width: 160, ellipsis: true },
    {
      title: '发货地',
      dataIndex: 'shippingFrom',
      width: 80,
      render: (v: string | undefined) => v || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
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
      render: (v: number | undefined) => v ?? '-',
    },
    {
      title: '现货',
      dataIndex: 'stockType',
      width: 80,
      render: (v: Inventory['stockType']) =>
        v ? <Tag color={v === 'in_stock_now' ? 'green' : 'orange'}>{STOCK_TYPE_LABEL[v]}</Tag> : '-',
    },
  ]

  return (
    <Modal
      title="选择额外库存（多选）"
      open={open}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={selectedRowKeys.length === 0}
          onClick={() => onConfirm(selectedRowKeys as string[])}
        >
          确认（{selectedRowKeys.length} 条）
        </Button>,
      ]}
    >
      <Space style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索：系统单号 / 物料编码 / 物料名称 / 客户"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 380 }}
        />
        <span style={{ color: '#999' }}>
          共 {candidates.length} 条可选，已排除 {excludeIds.length} 条
        </span>
      </Space>
      <Table<Inventory>
        rowKey="id"
        size="small"
        dataSource={candidates}
        loading={false}
        scroll={{ y: 380 }}
        locale={{ emptyText: <Empty description="暂无可选库存" /> }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: false,
        }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        columns={columns}
      />
    </Modal>
  )
}