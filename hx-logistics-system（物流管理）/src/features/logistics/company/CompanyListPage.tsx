import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageContainer, SearchForm, Empty } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, parseCities, formatCities } from '@/utils'
import type { LogisticsCompany } from '@/types'

const VEHICLE_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  heavy: { label: '重型', color: 'red' },
  medium: { label: '中型', color: 'orange' },
  light: { label: '轻型', color: 'blue' },
}

const VEHICLE_TYPE_OPTIONS = [
  { value: 'heavy', label: '重型' },
  { value: 'medium', label: '中型' },
  { value: 'light', label: '轻型' },
]

/** 物流公司档案 */
export function CompanyListPage() {
  const { companies, loadCompanies } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LogisticsCompany | null>(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleSave = async () => {
    const values = await form.validateFields()
    const directionsNorm = formatCities(parseCities(values.directions))
    const item: LogisticsCompany = {
      id: editing?.id || genId('company'),
      name: values.name,
      code: values.code,
      contactName: values.contactName,
      contactPhone: values.contactPhone,
      address: values.address,
      businessLicense: values.businessLicense,
      status: editing?.status || 'enabled',
      remark: values.remark,
      vehicleTypes: values.vehicleTypes || [],
      directions: directionsNorm,
      estimatedHours: Number(values.estimatedHours),
      createdAt: editing?.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    await mockDB.saveCompany(item)
    await loadCompanies()
    message.success(editing ? '编辑成功' : '创建成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteCompany(id)
    await loadCompanies()
    message.success('删除成功')
  }

  const handleToggle = async (record: LogisticsCompany) => {
    await mockDB.saveCompany({ ...record, status: record.status === 'enabled' ? 'disabled' : 'enabled' })
    await loadCompanies()
    message.success(record.status === 'enabled' ? '已停用' : '已启用')
  }

  const filtered = companies.filter((c) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (!c.name.toLowerCase().includes(kw) && !c.code.toLowerCase().includes(kw)) return false
    }
    if (filters.status && c.status !== filters.status) return false
    return true
  })

  return (
    <PageContainer
      title="物流公司档案"
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
          新建公司
        </Button>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '关键词', type: 'input', placeholder: '名称/编码' },
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
      <Table<LogisticsCompany>
        rowKey="id"
        dataSource={filtered}
        locale={{ emptyText: <Empty description="暂无物流公司" /> }}
        columns={[
          { title: '公司名称', dataIndex: 'name', width: 220 },
          { title: '编码', dataIndex: 'code', width: 100 },
          { title: '联系人', dataIndex: 'contactName', width: 90 },
          { title: '联系电话', dataIndex: 'contactPhone', width: 120 },
          {
            title: '可提供车型',
            dataIndex: 'vehicleTypes',
            width: 130,
            render: (vt: LogisticsCompany['vehicleTypes']) => (
              <Space size={4} wrap>
                {(vt || []).map((t) => (
                  <Tag key={t} color={VEHICLE_TYPE_LABEL[t]?.color}>
                    {VEHICLE_TYPE_LABEL[t]?.label || t}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '服务方向',
            dataIndex: 'directions',
            width: 220,
            ellipsis: true,
            render: (s: string) => s || '-',
          },
          {
            title: '预计时长(h)',
            dataIndex: 'estimatedHours',
            width: 110,
            sorter: (a, b) => (a.estimatedHours || 0) - (b.estimatedHours || 0),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            render: (s: string) => {
              const opt = STATUS_LABEL[s]
              return <Tag color={opt.color}>{opt.label}</Tag>
            },
          },
          {
            title: '操作',
            fixed: 'right',
            width: 220,
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
        scroll={{ x: 1800 }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑物流公司' : '新建物流公司'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="公司名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="公司编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="联系人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="businessLicense" label="营业执照号">
            <Input />
          </Form.Item>
          <Form.Item
            name="vehicleTypes"
            label="可提供车型"
            rules={[{ required: true, message: '请至少选择一种车型' }]}
          >
            <Select
              mode="multiple"
              placeholder="可多选：重型/中型/轻型"
              options={VEHICLE_TYPE_OPTIONS}
            />
          </Form.Item>
          <Form.Item
            name="directions"
            label="服务方向"
            tooltip="多个城市用 /、, 或空格分隔，如：杭州 / 上海"
            rules={[{ required: true, message: '请输入服务方向（至少 1 个城市）' }]}
          >
            <Input placeholder="杭州 / 上海" />
          </Form.Item>
          <Form.Item
            name="estimatedHours"
            label="预计时长（小时）"
            rules={[{ required: true, message: '请输入预计时长' }]}
          >
            <InputNumber min={1} max={240} style={{ width: '100%' }} addonAfter="小时" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}