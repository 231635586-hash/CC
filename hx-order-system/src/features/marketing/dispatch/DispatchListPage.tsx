import { useEffect, useState, useMemo } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, AutoComplete, Modal, Form, Radio, Input, Alert } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer, SearchForm, Empty, renderYardNames, SCROLL_PRESETS, BoolTags } from '@/components'
import { useDispatchStore, useDictStore, useAuthStore } from '@/stores'
import { DISPATCH_STATUS_OPTIONS, type DispatchStatus } from '@/types'
import {
  SHIPPING_METHOD_LABEL,
  SHIPPING_METHOD_COLOR,
  TRUCK_SIZE_LABEL,
  VOID_REASON_OPTIONS,
  VOID_REASON_LABEL,
} from '@/types/dispatch'
import { parseCities, nowIsoString } from '@/utils'
import type { Dispatch } from '@/types/dispatch'
import { DispatchFormDrawer } from './DispatchFormDrawer'

/**
 * 调车单列表页
 *
 * M1 增强（2026-06-25）：
 * - confirmed 状态可作废（仅创建人或营销业务员/管理员可操作）
 * - 作废后状态 → cancelled，并记录 voidedAt/voidedBy/voidReason
 * - cancelled 状态可物理删除（便于重建）
 */
export function DispatchListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list, load, save, remove, loading } = useDispatchStore()
  const { loadCompanies, loadYards, yards } = useDictStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Dispatch | null>(null)
  const [linkedInventoryIds, setLinkedInventoryIds] = useState<string[] | null>(null)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  // 作废弹窗状态
  const [voidModalOpen, setVoidModalOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<Dispatch | null>(null)
  const [voidForm] = Form.useForm<{ reasonKey: string; reasonText?: string }>()

  /**
   * 作废权限判断：
   * - 系统管理员：全权限
   * - 创建人本人
   * - 营销业务员/营销负责人（roleName 含"营销"字样）
   */
  const canVoid = (d: Dispatch): boolean => {
    if (!currentUser) return false
    if (currentUser.roleName === '系统管理员') return true
    if (d.creatorId === currentUser.id) return true
    if (currentUser.roleName && currentUser.roleName.includes('营销')) return true
    return false
  }

  useEffect(() => {
    load()
    loadCompanies()
    loadYards()
  }, [load, loadCompanies, loadYards])

  /**
   * 渲染园区名称：调用共享 renderYardNames（多园区用 / 分隔；primaryYardId 加"优先入场"标记）
   */
  const renderYard = (yardIds: string[] | undefined, primaryYardId?: string) =>
    renderYardNames(yardIds, primaryYardId, yards)

  // 从 URL 参数识别"库存关联"入口（支持多 ID：?inventoryId=A&inventoryId=B）
  useEffect(() => {
    const ids = searchParams.getAll('inventoryId')
    if (ids.length) {
      setLinkedInventoryIds(ids)
      setEditing(null)
      setDrawerOpen(true)
    }
  }, [searchParams])

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setLinkedInventoryIds(null)
    if (searchParams.has('inventoryId')) {
      setSearchParams({})
    }
  }

  const handleEdit = (record: Dispatch) => {
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    message.success('删除成功')
  }

  const handleConfirm = async (record: Dispatch) => {
    await save({ ...record, status: 'confirmed' as DispatchStatus, confirmedAt: nowIsoString() })
    message.success('已确认')
  }

  const handleCancel = async (record: Dispatch) => {
    await save({ ...record, status: 'cancelled' as DispatchStatus })
    message.success('已取消')
  }

  /** 打开作废弹窗（仅 confirmed 状态触发） */
  const handleVoid = (record: Dispatch) => {
    setVoidTarget(record)
    voidForm.resetFields()
    voidForm.setFieldsValue({ reasonKey: 'order_error' })
    setVoidModalOpen(true)
  }

  /** 提交作废 */
  const handleVoidSubmit = async () => {
    if (!voidTarget || !currentUser) return
    try {
      const { reasonKey, reasonText } = await voidForm.validateFields()
      const reason = reasonKey === 'other'
        ? (reasonText || '').trim()
        : VOID_REASON_LABEL[reasonKey] || reasonKey
      await save({
        ...voidTarget,
        status: 'cancelled' as DispatchStatus,
        voidedAt: nowIsoString(),
        voidedById: currentUser.id,
        voidedByName: currentUser.realName,
        voidReason: reason,
      })
      message.success('已作废')
      setVoidModalOpen(false)
      setVoidTarget(null)
    } catch {
      // 校验失败由 antd 处理
    }
  }

  /**
   * 物理删除权限：cancelled 状态可删除（前提：本人或营销/管理员）
   * 复用 canVoid 逻辑（同一组权限）
   */
  const canDelete = (d: Dispatch): boolean => canVoid(d)

  // 筛选
  const filtered = list.filter((d) => {
    if (filters.keyword) {
      const kw = String(filters.keyword).toLowerCase()
      if (
        !d.dispatchNo.toLowerCase().includes(kw) &&
        !d.companyName.toLowerCase().includes(kw) &&
        !(d.yardIds || []).some((yid) => (yards.find((y) => y.id === yid)?.name || '').toLowerCase().includes(kw))
      )
        return false
    }
    if (filters.status && d.status !== filters.status) return false
    if (filters.direction && !parseCities(d.direction).includes(filters.direction as string)) return false
    if (filters.yardId && !(d.yardIds || []).includes(filters.yardId as string)) return false
    return true
  })

  // 收集所有出现过的方向城市（用于搜索 AutoComplete）
  const directionOptions = useMemo(() => {
    return Array.from(
      new Set(list.flatMap((d) => parseCities(d.direction))),
    ).map((c) => ({ value: c }))
  }, [list])

  return (
    <PageContainer
      title="调车单管理"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              setDrawerOpen(true)
            }}
          >
            新建调车单
          </Button>
        </Space>
      }
    >
      <SearchForm
        items={[
          { name: 'keyword', label: '关键词', type: 'input', placeholder: '编号/公司/园区' },
          {
            name: 'status',
            label: '状态',
            type: 'select',
            options: DISPATCH_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
        onSearch={setFilters}
      />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#666' }}>方向：</span>
        <AutoComplete
          style={{ width: 220 }}
          placeholder="输入城市，如：杭州"
          allowClear
          value={(filters.direction as string) || ''}
          options={directionOptions}
          onChange={(v) => setFilters((prev) => ({ ...prev, direction: v || '' }))}
          filterOption={(input, option) =>
            (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Table<Dispatch>
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        locale={{ emptyText: <Empty description="暂无调车单" /> }}
        columns={[
          { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: DispatchStatus, r) => {
              const opt = DISPATCH_STATUS_OPTIONS.find((o) => o.value === s)
              return (
                <Space size={4} wrap>
                  <Tag color={opt?.color}>{opt?.label || s}</Tag>
                  <BoolTags isUrgent={r.isUrgent} isCarpool={r.isCarpool} />
                </Space>
              )
            },
          },
          {
            title: '发运方式',
            dataIndex: 'shippingMethod',
            width: 100,
            render: (sm: Dispatch['shippingMethod']) => {
              if (!sm) return '-'
              return (
                <Tag color={SHIPPING_METHOD_COLOR[sm]}>
                  {SHIPPING_METHOD_LABEL[sm]}
                </Tag>
              )
            },
          },
          {
            title: '车型',
            dataIndex: 'truckSize',
            width: 90,
            render: (ts: Dispatch['truckSize']) =>
              ts ? <Tag>{TRUCK_SIZE_LABEL[ts]}</Tag> : '-',
          },
          {
            title: '服务方向',
            dataIndex: 'direction',
            width: 110,
            ellipsis: true,
            render: (d: string) => d || '-',
          },
          { title: '物流公司', dataIndex: 'companyName', width: 180 },
          {
            title: '园区',
            dataIndex: 'yardIds',
            width: 200,
            render: (yardIds: string[] | undefined, r) => renderYard(yardIds, r.primaryYardId),
          },
          {
            title: '货物',
            dataIndex: 'goods',
            width: 220,
            render: (goods: Dispatch['goods']) => {
              if (!goods?.length) return '-'
              if (goods.length === 1) return `${goods[0].goodsName} × ${goods[0].quantity}${goods[0].unit}`
              return (
                <Tooltip title={goods.map((g) => `${g.goodsName} × ${g.quantity}${g.unit}`).join('；')}>
                  <Tag color="blue">拼车 {goods.length} 单</Tag>
                </Tooltip>
              )
            },
          },
          { title: '期望装货时间', dataIndex: 'expectedLoadTime', width: 160 },
          { title: '创建人', dataIndex: 'creatorName', width: 100 },
          {
            title: '操作',
            fixed: 'right',
            width: 260,
            render: (_, r) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/marketing/dispatch/${r.id}`)}
                >
                  详情
                </Button>
                {r.status === 'pending_confirm' && (
                  <>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleConfirm(r)}
                    >
                      确认
                    </Button>
                    <Popconfirm title="确定取消该调车单？" onConfirm={() => handleCancel(r)}>
                      <Button type="link" size="small" danger icon={<CloseOutlined />}>
                        取消
                      </Button>
                    </Popconfirm>
                  </>
                )}
                {r.status === 'confirmed' && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    disabled={!canVoid(r)}
                    onClick={() => handleVoid(r)}
                  >
                    作废
                  </Button>
                )}
                {(r.status === 'cancelled' || r.status === 'draft') && canDelete(r) && (
                  <Popconfirm
                    title="确定删除？此操作不可恢复"
                    okText="确认删除"
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                    onConfirm={() => handleDelete(r.id)}
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
        scroll={{ x: SCROLL_PRESETS.medium }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <DispatchFormDrawer
        open={drawerOpen}
        dispatch={editing}
        linkedInventoryIds={linkedInventoryIds || undefined}
        onClose={handleCloseDrawer}
      />

      {/* 作废弹窗（仅 confirmed 状态） */}
      <Modal
        title={`作废调车单 - ${voidTarget?.dispatchNo || ''}`}
        open={voidModalOpen}
        onCancel={() => {
          setVoidModalOpen(false)
          setVoidTarget(null)
        }}
        onOk={handleVoidSubmit}
        okText="确认作废"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={520}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="作废后状态将变为【已取消】，可被物理删除便于重新发起。请如实填写作废原因。"
        />
        {voidTarget && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
            <Space wrap>
              <Tag color="blue">{voidTarget.dispatchNo}</Tag>
              <Tag>{voidTarget.companyName}</Tag>
              <Tag color="cyan">{voidTarget.direction}</Tag>
            </Space>
          </div>
        )}
        <Form form={voidForm} layout="vertical">
          <Form.Item
            name="reasonKey"
            label="作废原因"
            rules={[{ required: true, message: '请选择作废原因' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                {VOID_REASON_OPTIONS.map((o) => (
                  <Radio key={o.value} value={o.value}>{o.label}</Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.reasonKey !== cur.reasonKey}
          >
            {({ getFieldValue }) =>
              getFieldValue('reasonKey') === 'other' ? (
                <Form.Item
                  name="reasonText"
                  label="具体原因"
                  rules={[{ required: true, message: '请输入具体原因' }, { max: 200 }]}
                >
                  <Input.TextArea rows={3} placeholder="请说明具体作废原因（200 字内）" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item label="作废人">
            <Input value={currentUser?.realName || '未知用户'} disabled prefix={<span style={{ color: '#999' }}>系统</span>} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
