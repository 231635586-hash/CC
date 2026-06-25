import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageContainer, SearchForm, Empty, SCROLL_PRESETS } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, nowIsoString } from '@/utils'
import type { Vehicle } from '@/types'

/** 车辆档案 */
export function VehicleListPage() {
  const { vehicles, drivers, companies, loadVehicles, loadDrivers, loadCompanies } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadVehicles()
    loadDrivers()
    loadCompanies()
  }, [loadVehicles, loadDrivers, loadCompanies])

  // 默认司机下拉：按当前选择的物流公司过滤
  const selectedCompanyId = Form.useWatch('companyId', form)
  const driverOptions = drivers
    .filter((d) => !selectedCompanyId || d.companyId === selectedCompanyId)
    .map((d) => ({ value: d.id, label: `${d.name}（${d.phone}）` }))

  const handleSave = async () => {
    const values = await form.validateFields()
    const company = companies.find((c) => c.id === values.companyId)
    const item: Vehicle = {
      id: editing?.id || genId('vehicle'),
      plateNo: values.plateNo,
      companyId: values.companyId,
      companyName: company?.name || '',
      vehicleType: values.vehicleType,
      maxLoad: values.maxLoad,
      length: values.length,
      defaultDriverId: values.defaultDriverId,
      status: editing?.status || 'enabled',
      remark: values.remark,
      createdAt: editing?.createdAt || nowIsoString(),
    }
    await mockDB.saveVehicle(item)
    await loadVehicles()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteVehicle(id)
    await loadVehicles()
    message.success('删除成功')
  }

  const handleToggle = async (record: Vehicle) => {
    await mockDB.saveVehicle({ ...record, status: record.status === 'enabled' ? 'disabled' : 'enabled' })
    await loadVehicles()
    message.success('已切换')
  }

  const filtered = vehicles.filter((v) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (!v.plateNo.toLowerCase().includes(kw)) return false
    }
    if (filters.companyId && v.companyId !== filters.companyId) return false
    if (filters.status && v.status !== filters.status) return false
    return true
  })

  return (
    <PageContainer
      title="车辆档案"
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
          新建车辆
        </Button>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '车牌号', type: 'input' },
          {
            name: 'companyId',
            label: '物流公司',
            type: 'select',
            options: companies.map((c) => ({ value: c.id, label: c.name })),
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
      <Table<Vehicle>
        rowKey="id"
        dataSource={filtered}
        locale={{ emptyText: <Empty description="暂无车辆" /> }}
        columns={[
          { title: '车牌号', dataIndex: 'plateNo', width: 120 },
          { title: '所属公司', dataIndex: 'companyName', width: 200 },
          {
            title: '默认司机',
            dataIndex: 'defaultDriverId',
            width: 120,
            render: (id: string | undefined) => drivers.find((d) => d.id === id)?.name || '-',
          },
          {
            title: '车型',
            dataIndex: 'vehicleType',
            width: 80,
            render: (t: string) => {
              const map: Record<string, { label: string; color: string }> = {
                heavy: { label: '重型', color: 'red' },
                medium: { label: '中型', color: 'orange' },
                light: { label: '轻型', color: 'blue' },
              }
              return <Tag color={map[t].color}>{map[t].label}</Tag>
            },
          },
          { title: '最大载重(吨)', dataIndex: 'maxLoad', width: 120 },
          { title: '车长(米)', dataIndex: 'length', width: 100 },
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
        title={editing ? '编辑车辆' : '新建车辆'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="plateNo" label="车牌号" rules={[{ required: true }]}>
            <Input placeholder="如：沪A12345" />
          </Form.Item>
          <Form.Item name="companyId" label="所属物流公司" rules={[{ required: true }]}>
            <Select options={companies.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="defaultDriverId" label="默认司机" tooltip="按所选物流公司过滤；未选公司时显示全部">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="可选；后续可在车辆位置页查看司机联系方式"
              disabled={!selectedCompanyId && drivers.length === 0}
              options={driverOptions}
            />
          </Form.Item>
          <Form.Item name="vehicleType" label="车型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'heavy', label: '重型' },
                { value: 'medium', label: '中型' },
                { value: 'light', label: '轻型' },
              ]}
            />
          </Form.Item>
          <Form.Item name="maxLoad" label="最大载重（吨）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="length" label="车长（米）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
