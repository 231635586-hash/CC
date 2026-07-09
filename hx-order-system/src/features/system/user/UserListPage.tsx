import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { PageContainer, SearchForm, Empty, SCROLL_PRESETS } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, nowIsoString } from '@/utils'
import type { User } from '@/types'

/** 用户管理 */
export function UserListPage() {
  const { users, roles, companies, loadUsers, loadRoles, loadCompanies } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadCompanies()
  }, [loadUsers, loadRoles, loadCompanies])

  const handleSave = async () => {
    const values = await form.validateFields()
    const role = roles.find((r) => r.id === values.roleId)
    const company = values.companyId ? companies.find((c) => c.id === values.companyId) : undefined
    const item: User = {
      id: editing?.id || genId('user'),
      username: values.username,
      realName: values.realName,
      phone: values.phone,
      email: values.email,
      roleId: values.roleId,
      roleName: role?.name || '',
      companyId: values.companyId,
      companyName: company?.name,
      status: editing?.status || 'enabled',
      createdAt: editing?.createdAt || nowIsoString(),
      lastLoginAt: editing?.lastLoginAt,
    }
    await mockDB.saveUser(item)
    await loadUsers()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteUser(id)
    await loadUsers()
    message.success('删除成功')
  }

  const handleToggle = async (record: User) => {
    await mockDB.saveUser({ ...record, status: record.status === 'enabled' ? 'disabled' : 'enabled' })
    await loadUsers()
    message.success('已切换')
  }

  const filtered = users.filter((u) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (!u.username.toLowerCase().includes(kw) && !u.realName.toLowerCase().includes(kw)) return false
    }
    if (filters.roleId && u.roleId !== filters.roleId) return false
    if (filters.status && u.status !== filters.status) return false
    return true
  })

  return (
    <PageContainer
      title="用户管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setModalOpen(true)
          }}
        >
          新建用户
        </Button>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '关键词', type: 'input', placeholder: '账号/姓名' },
          {
            name: 'roleId',
            label: '角色',
            type: 'select',
            options: roles.map((r) => ({ value: r.id, label: r.name })),
          },
          {
            name: 'status',
            label: '状态',
            type: 'select',
            options: [
              { value: 'enabled', label: '启用' },
              { value: 'disabled', label: '停用' },
            ],
          },
        ]}
        onSearch={setFilters}
      />
      <Table<User>
        rowKey="id"
        dataSource={filtered}
        locale={{ emptyText: <Empty description="暂无用户" /> }}
        columns={[
          {
            title: '账号',
            dataIndex: 'username',
            width: 140,
            render: (v: string) => (
              <Space>
                <UserOutlined />
                {v}
              </Space>
            ),
          },
          { title: '姓名', dataIndex: 'realName', width: 120 },
          { title: '手机号', dataIndex: 'phone', width: 130 },
          { title: '邮箱', dataIndex: 'email', width: 200 },
          {
            title: '角色',
            dataIndex: 'roleName',
            width: 140,
            render: (v: string) => <Tag color="blue">{v}</Tag>,
          },
          { title: '所属公司', dataIndex: 'companyName', width: 180, render: (v) => v || '-' },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: string) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].label}</Tag>,
          },
          { title: '最后登录', dataIndex: 'lastLoginAt', width: 160, render: (v) => v || '-' },
          {
            title: '操作',
            fixed: 'right',
            width: 200,
            render: (_, r) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditing(r)
                    form.setFieldsValue(r)
                    setModalOpen(true)
                  }}
                >
                  编辑
                </Button>
                <Button type="link" size="small" onClick={() => handleToggle(r)}>
                  {r.status === 'enabled' ? '停用' : '启用'}
                </Button>
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: SCROLL_PRESETS.medium }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="realName" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, len: 11 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true }]}>
            <Select options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item shouldUpdate={(p, c) => p.roleId !== c.roleId} noStyle>
            {() => {
              const roleId = form.getFieldValue('roleId')
              const role = roles.find((r) => r.id === roleId)
              return role?.code === 'company_admin' ? (
                <Form.Item name="companyId" label="所属物流公司" rules={[{ required: true }]}>
                  <Select options={companies.map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              ) : null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
