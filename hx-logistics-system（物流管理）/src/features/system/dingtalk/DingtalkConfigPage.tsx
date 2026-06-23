import { useEffect, useState } from 'react'
import { Tabs, Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select, Card, Alert, Tooltip, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SendOutlined } from '@ant-design/icons'
import { PageContainer, Empty } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL } from '@/utils'
import type { DingtalkBot, DingtalkTemplate } from '@/types'

/** 钉钉配置：群机器人 + 消息模板 */
export function DingtalkConfigPage() {
  const { dingtalkBots, dingtalkTemplates, loadDingtalkBots, loadDingtalkTemplates } = useDictStore()
  const [tab, setTab] = useState('bots')

  useEffect(() => {
    loadDingtalkBots()
    loadDingtalkTemplates()
  }, [loadDingtalkBots, loadDingtalkTemplates])

  return (
    <PageContainer title="钉钉配置">
      <Alert
        message="M1 阶段：仅维护配置，实际推送待后端联调"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'bots', label: `群机器人 (${dingtalkBots.length})`, children: <BotTab /> },
        { key: 'templates', label: `消息模板 (${dingtalkTemplates.length})`, children: <TemplateTab /> },
      ]} />
    </PageContainer>
  )
}

// ========== 群机器人 Tab ==========
function BotTab() {
  const { dingtalkBots } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DingtalkBot | null>(null)
  const [form] = Form.useForm()

  const handleSave = async () => {
    const values = await form.validateFields()
    const yard = values.yardId ? undefined : undefined
    const item: DingtalkBot = {
      id: editing?.id || genId('bot'),
      name: values.name,
      webhookUrl: values.webhookUrl,
      secret: values.secret,
      groupType: values.groupType,
      yardId: values.yardId,
      yardName: yard?.name,
      status: editing?.status || 'enabled',
      remark: values.remark,
      createdAt: editing?.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    await mockDB.saveDingtalkBot(item)
    const { loadDingtalkBots } = useDictStore.getState()
    await loadDingtalkBots()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteDingtalkBot(id)
    const { loadDingtalkBots } = useDictStore.getState()
    await loadDingtalkBots()
    message.success('删除成功')
  }

  const handleTest = (record: DingtalkBot) => {
    message.info(`模拟推送：测试消息已发送至 ${record.name}`)
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setModalOpen(true)
          }}
        >
          新建群机器人
        </Button>
      </Space>
      <Table<DingtalkBot>
        rowKey="id"
        dataSource={dingtalkBots}
        locale={{ emptyText: <Empty description="暂无钉钉群机器人" /> }}
        columns={[
          { title: '名称', dataIndex: 'name', width: 200 },
          {
            title: '群类型',
            dataIndex: 'groupType',
            width: 120,
            render: (t: string) => {
              const map: Record<string, { label: string; color: string }> = {
                logistics: { label: '物流群', color: 'blue' },
                factory: { label: '工厂群', color: 'orange' },
                management: { label: '管理群', color: 'purple' },
              }
              return <Tag color={map[t].color}>{map[t].label}</Tag>
            },
          },
          { title: '关联园区', dataIndex: 'yardName', width: 150, render: (v) => v || '-' },
          {
            title: 'Webhook',
            dataIndex: 'webhookUrl',
            render: (v: string) => (
              <Tooltip title={v}>
                <span>
                  {v.slice(0, 40)}...{' '}
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(v)
                      message.success('已复制')
                    }}
                  />
                </span>
              </Tooltip>
            ),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: string) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].label}</Tag>,
          },
          { title: '备注', dataIndex: 'remark' },
          {
            title: '操作',
            fixed: 'right',
            width: 200,
            render: (_, r) => (
              <Space size="small">
                <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleTest(r)}>
                  测试
                </Button>
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
        scroll={{ x: 1300 }}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑群机器人' : '新建群机器人'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如：顺达物流-华东群" />
          </Form.Item>
          <Form.Item name="groupType" label="群类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'logistics', label: '物流群（推送给物流公司）' },
                { value: 'factory', label: '工厂群（推送给华翔内部）' },
                { value: 'management', label: '管理群（推送给管理层）' },
              ]}
            />
          </Form.Item>
          <Form.Item shouldUpdate={(p, c) => p.groupType !== c.groupType} noStyle>
            {() =>
              form.getFieldValue('groupType') === 'factory' ? (
                <Form.Item name="yardId" label="关联园区" rules={[{ required: true }]}>
                  <Select options={[]} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="webhookUrl"
            label="Webhook URL"
            rules={[{ required: true, type: 'url' }]}
          >
            <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
          </Form.Item>
          <Form.Item name="secret" label="加签密钥（可选）">
            <Input.Password placeholder="SECxxxxx" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ========== 消息模板 Tab ==========
function TemplateTab() {
  const { dingtalkTemplates } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DingtalkTemplate | null>(null)
  const [form] = Form.useForm()

  const handleSave = async () => {
    const values = await form.validateFields()
    const variables = (values.content.match(/\$\{([^}]+)\}/g) || []).map((v: string) => v.slice(2, -1))
    const item: DingtalkTemplate = {
      id: editing?.id || genId('tpl'),
      code: values.code,
      name: values.name,
      content: values.content,
      variables: Array.from(new Set(variables)),
      status: editing?.status || 'enabled',
      createdAt: editing?.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    await mockDB.saveDingtalkTemplate(item)
    const { loadDingtalkTemplates } = useDictStore.getState()
    await loadDingtalkTemplates()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteDingtalkTemplate(id)
    const { loadDingtalkTemplates } = useDictStore.getState()
    await loadDingtalkTemplates()
    message.success('删除成功')
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setModalOpen(true)
          }}
        >
          新建模板
        </Button>
      </Space>
      <Table<DingtalkTemplate>
        rowKey="id"
        dataSource={dingtalkTemplates}
        locale={{ emptyText: <Empty description="暂无消息模板" /> }}
        columns={[
          { title: '编码', dataIndex: 'code', width: 150 },
          { title: '名称', dataIndex: 'name', width: 150 },
          {
            title: '变量',
            dataIndex: 'variables',
            width: 240,
            render: (v: string[]) => (
              <Space wrap>
                {v.map((x) => (
                  <Tag key={x} color="blue">
                    {`{{${x}}}`}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '内容预览',
            dataIndex: 'content',
            render: (v: string) => <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{v}</pre>,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: string) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].label}</Tag>,
          },
          {
            title: '操作',
            fixed: 'right',
            width: 150,
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
        scroll={{ x: 1000 }}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑模板' : '新建模板'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="编码" rules={[{ required: true }]}>
                <Input placeholder="如：DISPATCH_NOTIFY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                <Input placeholder="如：调车通知" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="内容（变量使用 ${varName} 占位）"
            rules={[{ required: true }]}
            extra="示例：调车单号 ${dispatchNo}, 装货时间 ${expectedLoadTime}"
          >
            <Input.TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
