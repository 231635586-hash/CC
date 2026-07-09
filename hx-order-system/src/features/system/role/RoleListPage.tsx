import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Checkbox, Row, Col, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageContainer, Empty, SCROLL_PRESETS } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, nowIsoString } from '@/utils'
import type { Role } from '@/types'

/** 权限点定义 */
const PERMISSION_GROUPS: { group: string; items: { code: string; label: string }[] }[] = [
  {
    group: '调车单',
    items: [
      { code: 'dispatch:view', label: '查看调车单' },
      { code: 'dispatch:create', label: '创建调车单' },
      { code: 'dispatch:edit', label: '编辑调车单' },
      { code: 'dispatch:dispatch', label: '派车' },
      { code: 'dispatch:confirm', label: '确认调车单' },
    ],
  },
  {
    group: '档案管理',
    items: [
      { code: 'vehicle:view', label: '查看车辆' },
      { code: 'vehicle:manage', label: '管理车辆' },
      { code: 'driver:view', label: '查看司机' },
      { code: 'driver:manage', label: '管理司机' },
      { code: 'dispatcher:manage', label: '管理调车员' },
    ],
  },
  {
    group: '系统管理',
    items: [
      { code: 'system:user', label: '用户管理' },
      { code: 'system:role', label: '角色管理' },
      { code: 'system:dingtalk', label: '钉钉配置' },
    ],
  },
]

/** 角色管理 */
export function RoleListPage() {
  const { roles, loadRoles } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleSave = async () => {
    const values = await form.validateFields()
    const item: Role = {
      id: editing?.id || genId('role'),
      name: values.name,
      code: values.code,
      permissions: values.permissions || [],
      status: editing?.status || 'enabled',
      remark: values.remark,
      createdAt: editing?.createdAt || nowIsoString(),
    }
    await mockDB.saveRole(item)
    await loadRoles()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteRole(id)
    await loadRoles()
    message.success('删除成功')
  }

  return (
    <PageContainer
      title="角色管理"
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
          新建角色
        </Button>
      }
    >
      <Table<Role>
        rowKey="id"
        dataSource={roles}
        locale={{ emptyText: <Empty description="暂无角色" /> }}
        columns={[
          { title: '角色名', dataIndex: 'name', width: 150 },
          { title: '编码', dataIndex: 'code', width: 150 },
          {
            title: '权限数',
            dataIndex: 'permissions',
            width: 100,
            render: (p: string[]) => (p.includes('*') ? <Tag color="red">全部</Tag> : <Tag>{p.length} 项</Tag>),
          },
          {
            title: '权限明细',
            dataIndex: 'permissions',
            render: (p: string[]) => {
              if (p.includes('*')) return <Tag color="red">* 全部权限</Tag>
              return (
                <Space wrap>
                  {p.slice(0, 4).map((x) => (
                    <Tag key={x}>{x}</Tag>
                  ))}
                  {p.length > 4 && <Tag>+{p.length - 4}</Tag>}
                </Space>
              )
            },
          },
          { title: '备注', dataIndex: 'remark' },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: string) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].label}</Tag>,
          },
          {
            title: '操作',
            fixed: 'right',
            width: 180,
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
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: SCROLL_PRESETS.narrow }}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="角色名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="编码" rules={[{ required: true }]}>
                <Input placeholder="如：admin/marketing" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="permissions" label="权限配置">
            <Card size="small" style={{ background: '#fafafa' }}>
              {PERMISSION_GROUPS.map((g) => (
                <div key={g.group} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>{g.group}</div>
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row>
                      {g.items.map((it) => (
                        <Col key={it.code} span={8}>
                          <Checkbox value={it.code}>{it.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              ))}
            </Card>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
