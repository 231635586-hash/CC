import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageContainer, SearchForm, Empty, SCROLL_PRESETS } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, parseCities, formatCities, nowIsoString } from '@/utils'
import { TRUCK_SIZE_LABEL, TRUCK_SIZE_OPTIONS, BIG_TRUCK_SIZES } from '@/types/dispatch'
import type { TruckSize } from '@/types/dispatch'
import type { LogisticsCompany } from '@/types'

/** 车型 Tag 颜色（按车长） */
const TRUCK_SIZE_COLOR: Record<TruckSize, string> = {
  '4.2m': 'blue',
  '6.8m': 'cyan',
  '13m': 'orange',
  '13.75m': 'gold',
  '17.5m': 'red',
}

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
      createdAt: editing?.createdAt || nowIsoString(),
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
            width: 220,
            render: (vt: LogisticsCompany['vehicleTypes']) => {
              if (!vt?.length) return '-'
              // 按大车 / 小车分组展示，保持与调车单一致
              const big = vt.filter((s) => BIG_TRUCK_SIZES.includes(s))
              const small = vt.filter((s) => !BIG_TRUCK_SIZES.includes(s))
              return (
                <Space size={4} wrap>
                  {big.length > 0 && (
                    <Tag color="red">{`大车 ${big.length} 种`}</Tag>
                  )}
                  {small.length > 0 && (
                    <Tag color="orange">{`小车 ${small.length} 种`}</Tag>
                  )}
                  {(vt || []).map((t) => (
                    <Tag key={t} color={TRUCK_SIZE_COLOR[t]}>
                      {TRUCK_SIZE_LABEL[t] || t}
                    </Tag>
                  ))}
                </Space>
              )
            },
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
        scroll={{ x: SCROLL_PRESETS.wide }}
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
            tooltip="与调车单车型保持一致：4.2m / 6.8m 为小车，13m / 13.75m / 17.5m 为大车"
            rules={[{ required: true, message: '请至少选择一种车型' }]}
          >
            <Select
              mode="multiple"
              placeholder="按车长选择（与调车单车型一致）"
              options={[
                {
                  label: '小车',
                  options: TRUCK_SIZE_OPTIONS.filter((o) =>
                    ['4.2m', '6.8m'].includes(o.value as string),
                  ),
                },
                {
                  label: '大车',
                  options: TRUCK_SIZE_OPTIONS.filter((o) =>
                    ['13m', '13.75m', '17.5m'].includes(o.value as string),
                  ),
                },
              ]}
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