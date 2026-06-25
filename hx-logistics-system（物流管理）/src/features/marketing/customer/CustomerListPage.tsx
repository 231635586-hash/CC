import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, DownloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { PageContainer } from '@/components'
import { useCustomerStore } from '@/stores'
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_COLOR } from '@/types/customer'
import type { Customer } from '@/types/customer'
import { CustomerFormDrawer } from './CustomerFormDrawer'
import { CustomerImportDrawer } from './CustomerImportDrawer'
import styles from './CustomerListPage.module.css'

export function CustomerListPage() {
  const { list, loadList, toggleStatus, remove } = useCustomerStore()
  const [searchName, setSearchName] = useState('')
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [searchCreator, setSearchCreator] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    loadList()
  }, [loadList])

  // 添加人下拉选项（从数据中动态提取）
  const creatorOptions = useMemo(() => {
    const set = new Set<string>()
    list.forEach((c) => c.creatorName && set.add(c.creatorName))
    return Array.from(set)
  }, [list])

  const filtered = list.filter((c) => {
    if (searchName && !c.name.toLowerCase().includes(searchName.toLowerCase())) return false
    if (searchStatus && c.status !== searchStatus) return false
    if (searchCreator && c.creatorName !== searchCreator) return false
    return true
  })

  const handleEdit = (record: Customer) => {
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditing(null)
    setDrawerOpen(true)
  }

  const handleToggle = (record: Customer) => {
    toggleStatus(record.id)
    message.success(record.status === 'active' ? '已停用' : '已启用')
  }

  /** 软删（active → inactive），保留记录以便审计 */
  const handleRemove = (record: Customer) => {
    if (record.status !== 'active') {
      message.warning('该客户已停用，无需重复删除')
      return
    }
    remove(record.id)
    message.success(`客户「${record.name}」已删除`)
  }

  /** 导出当前筛选结果到 Excel */
  const handleExport = () => {
    if (filtered.length === 0) {
      message.warning('当前无客户可导出')
      return
    }
    const rows = filtered.map((c) => ({
      客户编码: c.id,
      客户名称: c.name,
      客户地址: c.address,
      联系人: c.contact || '',
      联系电话: c.phone || '',
      状态: CUSTOMER_STATUS_LABEL[c.status],
      备注: c.remark || '',
      创建时间: c.createdAt,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    // 设置列宽
    ws['!cols'] = [
      { wch: 14 }, // 客户编码
      { wch: 24 }, // 客户名称
      { wch: 32 }, // 地址
      { wch: 12 }, // 联系人
      { wch: 14 }, // 电话
      { wch: 8 },  // 状态
      { wch: 20 }, // 备注
      { wch: 20 }, // 创建时间
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '客户档案')
    const filename = `客户档案_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, filename)
    message.success(`已导出 ${filtered.length} 条客户`)
  }

  return (
    <PageContainer title="客户档案">
      <div className={styles.searchRow}>
        <input
          className={styles.searchItem}
          placeholder="客户名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <select
          className={styles.searchItem}
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">停用</option>
        </select>
        <select
          className={styles.searchItem}
          value={searchCreator}
          onChange={(e) => setSearchCreator(e.target.value)}
        >
          <option value="">全部添加人</option>
          {creatorOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button
          onClick={() => {
            setSearchName('')
            setSearchStatus('')
            setSearchCreator('')
          }}
        >
          重置
        </Button>
      </div>

      <div className={styles.toolbar}>
        <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          批量导入
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          批量导出
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增客户
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        columns={[
          { title: '客户编码', dataIndex: 'id', width: 130 },
          { title: '客户名称', dataIndex: 'name', width: 220 },
          { title: '地址', dataIndex: 'address', ellipsis: true },
          { title: '联系人', dataIndex: 'contact', width: 100 },
          { title: '联系电话', dataIndex: 'phone', width: 130 },
          {
            title: '添加人',
            dataIndex: 'creatorName',
            width: 100,
            render: (v: string | undefined) => v || '-',
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (v: Customer['status']) => (
              <Tag color={CUSTOMER_STATUS_COLOR[v]}>{CUSTOMER_STATUS_LABEL[v]}</Tag>
            ),
          },
          {
            title: '操作',
            width: 230,
            fixed: 'right',
            render: (_, record) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Popconfirm
                  title={`确认删除客户「${record.name}」？`}
                  description="删除后客户将变为停用状态（可在「停用」客户列表中查看/恢复）"
                  okText="确认删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  disabled={record.status !== 'active'}
                  onConfirm={() => handleRemove(record)}
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={record.status !== 'active'}
                  >
                    删除
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={`确认${record.status === 'active' ? '停用' : '启用'}该客户？`}
                  onConfirm={() => handleToggle(record)}
                >
                  <Button type="link" size="small" icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}>
                    {record.status === 'active' ? '停用' : '启用'}
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />

      <CustomerFormDrawer
        open={drawerOpen}
        customer={editing}
        onClose={() => setDrawerOpen(false)}
      />

      <CustomerImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={loadList}
      />
    </PageContainer>
  )
}