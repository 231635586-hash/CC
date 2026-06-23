import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { PageContainer } from '@/components'
import { useCustomerStore } from '@/stores'
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_COLOR } from '@/types/customer'
import type { Customer } from '@/types/customer'
import { CustomerFormDrawer } from './CustomerFormDrawer'
import styles from './CustomerListPage.module.css'

export function CustomerListPage() {
  const { list, loadList, toggleStatus } = useCustomerStore()
  const [searchName, setSearchName] = useState('')
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  useEffect(() => {
    loadList()
  }, [loadList])

  const filtered = list.filter((c) => {
    if (searchName && !c.name.toLowerCase().includes(searchName.toLowerCase())) return false
    if (searchStatus && c.status !== searchStatus) return false
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
        <Button onClick={() => { setSearchName(''); setSearchStatus('') }}>重置</Button>
      </div>

      <div className={styles.toolbar}>
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
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (v: Customer['status']) => (
              <Tag color={CUSTOMER_STATUS_COLOR[v]}>{CUSTOMER_STATUS_LABEL[v]}</Tag>
            ),
          },
          {
            title: '操作',
            width: 180,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
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
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />

      <CustomerFormDrawer
        open={drawerOpen}
        customer={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </PageContainer>
  )
}
