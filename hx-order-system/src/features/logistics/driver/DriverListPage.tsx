import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageContainer, SearchForm, Empty, SCROLL_PRESETS } from '@/components'
import { useDictStore } from '@/stores'
import { mockDB } from '@/mock/db'
import { genId, STATUS_LABEL, nowIsoString } from '@/utils'
import type { Driver } from '@/types'

/** 司机档案（M1 模块补齐） */
export function DriverListPage() {
  const { drivers, companies, loadDrivers, loadCompanies } = useDictStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadDrivers()
    loadCompanies()
  }, [loadDrivers, loadCompanies])

  const handleSave = async () => {
    const values = await form.validateFields()
    const company = companies.find((c) => c.id === values.companyId)
    const item: Driver = {
      id: editing?.id || genId('driver'),
      name: values.name,
      phone: values.phone,
      companyId: values.companyId,
      companyName: company?.name || '',
      idCardNo: values.idCardNo,
      licenseNo: values.licenseNo,
      status: editing?.status || 'enabled',
      remark: values.remark,
      createdAt: editing?.createdAt || nowIsoString(),
    }
    await mockDB.saveDriver(item)
    await loadDrivers()
    message.success('保存成功')
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleDelete = async (id: string) => {
    await mockDB.deleteDriver(id)
    await loadDrivers()
    message.success('删除成功')
  }

  const handleToggle = async (record: Driver) => {
    await mockDB.saveDriver({ ...record, status: record.status === 'enabled' ? 'disabled' : 'enabled' })
    await loadDrivers()
    message.success('已切换')
  }

  const filtered = drivers.filter((d) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (
        !d.name.toLowerCase().includes(kw) &&
        !d.phone.toLowerCase().includes(kw) &&
        !(d.licenseNo || '').toLowerCase().includes(kw)
      ) {
        return false
      }
    }
    if (filters.companyId && d.companyId !== filters.companyId) return false
    if (filters.status && d.status !== filters.status) return false
    return true
  })

  return (
    <PageContainer
      title="司机档案"
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
          新建司机
        </Button>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '姓名/手机/驾驶证', type: 'input' },
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
      <Table<Driver>
        rowKey="id"
        dataSource={filtered}
        locale={{ emptyText: <Empty description="暂无司机" /> }}
        columns={[
          { title: '姓名', dataIndex: 'name', width: 100 },
          { title: '手机号', dataIndex: 'phone', width: 140 },
          { title: '所属公司', dataIndex: 'companyName', width: 220, ellipsis: true },
          { title: '身份证号', dataIndex: 'idCardNo', width: 200 },
          { title: '驾驶证号', dataIndex: 'licenseNo', width: 140 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: string) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].label}</Tag>,
          },
          { title: '备注', dataIndex: 'remark', ellipsis: true },
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
        title={editing ? '编辑司机' : '新建司机'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, max: 50 }]}>
            <Input placeholder="如：陈大壮" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="11 位手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="companyId" label="所属物流公司" rules={[{ required: true }]}>
            <Select options={companies.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="idCardNo" label="身份证号" rules={[{ max: 18 }]}>
            <Input placeholder="选填" maxLength={18} />
          </Form.Item>
          <Form.Item name="licenseNo" label="驾驶证号" rules={[{ max: 30 }]}>
            <Input placeholder="选填" maxLength={30} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}