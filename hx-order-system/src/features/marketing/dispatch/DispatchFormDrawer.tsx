import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import {
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  DatePicker,
  Button,
  Space,
  Divider,
  Table,
  Row,
  Col,
  Tag,
  Checkbox,
  message,
  Alert,
  Tooltip,
} from 'antd'
import { PlusOutlined, DeleteOutlined, LinkOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useDispatchStore, useDictStore, useAuthStore, useInventoryStore } from '@/stores'
import { InventoryPickerModal } from '@/components'
import { genId, genDispatchNo, parseCities, formatCities } from '@/utils'
import { validateDispatch, needTruckSize, getAvailableTruckSizes } from '@/utils/dispatchRules'
import type { Dispatch, DispatchGoods, ShippingMethod, TruckSize } from '@/types/dispatch'
import { SHIPPING_METHOD_OPTIONS } from '@/types/dispatch'
import { ORDER_TYPE_LABEL, STOCK_TYPE_LABEL } from '@/types/inventory'

interface Props {
  open: boolean
  dispatch?: Dispatch | null
  /** 从库存发起调车时传入，自动锁定所有库存并预填货物信息 */
  linkedInventoryIds?: string[]
  onClose: () => void
}

/** 调车单新建/编辑表单（支持拼车+多园区） */
export function DispatchFormDrawer({ open, dispatch, linkedInventoryIds, onClose }: Props) {
  const [form] = Form.useForm()
  // 货物清单不再支持手动新增，仅来源于库存管理（关联库存 + 选择额外库存）
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedGoodsKeys, setSelectedGoodsKeys] = useState<React.Key[]>([])
  const lockedIdsRef = useRef<Set<string>>(new Set())
  const save = useDispatchStore((s) => s.save)
  const companies = useDictStore((s) => s.companies)
  const yards = useDictStore((s) => s.yards)
  const loadYards = useDictStore((s) => s.loadYards)
  const currentUser = useAuthStore((s) => s.currentUser)
  const { getById, lockMany, unlock } = useInventoryStore()

  // 监听 direction 字段，联动筛选物流公司
  const directionValue = Form.useWatch('direction', form)
  const availableCompanies = useMemo(() => {
    if (!directionValue || !directionValue.trim()) return companies
    const cities = parseCities(directionValue)
    return companies.filter((c) => {
      const cCities = parseCities(c.directions)
      return cities.some((city) => cCities.includes(city))
    })
  }, [companies, directionValue])

  // 监听发货方式 / 车型 / 时间 / 紧急 / 园区，实时校验
  const shippingMethodWatch = Form.useWatch('shippingMethod', form) as ShippingMethod | undefined
  const truckSizeWatch = Form.useWatch('truckSize', form) as TruckSize | undefined
  const expectedLoadTimeWatch = Form.useWatch('expectedLoadTime', form) as string | Dayjs | undefined
  const isUrgentWatch = Form.useWatch('isUrgent', form) as boolean | undefined
  const yardIdsWatch = (Form.useWatch('yardIds', form) as string[] | undefined) || []

  // 系统管理员角色可勾选紧急调车
  const isAdmin = currentUser?.roleName === '系统管理员'

  /** 综合校验结果 */
  const validation = useMemo(() => {
    if (!shippingMethodWatch || !expectedLoadTimeWatch) return { valid: true }
    const expected = typeof expectedLoadTimeWatch === 'string'
      ? expectedLoadTimeWatch
      : (expectedLoadTimeWatch as Dayjs)?.format?.('YYYY-MM-DD HH:mm:ss') || ''
    if (!expected) return { valid: true }
    return validateDispatch(
      {
        shippingMethod: shippingMethodWatch,
        truckSize: truckSizeWatch,
        expectedLoadTime: expected,
        isUrgent: !!isUrgentWatch,
      },
      useDispatchStore.getState().list,
      dispatch?.id,
    )
  }, [shippingMethodWatch, truckSizeWatch, expectedLoadTimeWatch, isUrgentWatch, dispatch?.id])

  useEffect(() => {
    loadYards()
  }, [loadYards])

  useEffect(() => {
    if (!open) return
    loadYards()
    form.resetFields()
    if (dispatch) {
      // 编辑模式：仅回填表单，不锁库存
      form.setFieldsValue({
        ...dispatch,
        expectedLoadTime: dispatch.expectedLoadTime ? dayjs(dispatch.expectedLoadTime) : null,
        isCarpool: !!dispatch.isCarpool,
        isUrgent: !!dispatch.isUrgent,
      })
    } else {
      form.setFieldsValue({
        dispatchNo: genDispatchNo(),
        status: 'pending_confirm',
      })
      // 从库存发起调车：锁定所有库存 + 预填货物
      if (linkedInventoryIds?.length) {
        lockMany(linkedInventoryIds)
        lockedIdsRef.current = new Set(linkedInventoryIds)
        const initial: DispatchGoods[] = linkedInventoryIds
          .map(getById)
          .filter((inv): inv is NonNullable<ReturnType<typeof getById>> => Boolean(inv))
          .map((inv) => ({
            id: genId('goods'),
            dispatchId: 'temp',
            goodsName: inv.materialName,
            quantity: inv.quantity,
            unit: '箱',
            weight: inv.netWeight,
            customerName: inv.customerName,
            destination: inv.customerAddress,
            inventoryId: inv.id,
            // 从来源库存带入业务员（与库存录入人保持一致）
            salesPersonId: inv.salesPersonId,
            salesPersonName: inv.salesPersonName,
            // 从来源库存快照现货/等货 + 预计到货时间（创建时锁定，库存后续变更不影响）
            stockType: inv.stockType,
            expectedArrivalAt: inv.expectedArrivalAt,
            remark: `从库存 ${inv.id} 关联，订单类型：${ORDER_TYPE_LABEL[inv.orderType]}`,
          }))
        form.setFieldValue('_pendingGoods', initial)
        message.success(`已锁定 ${linkedInventoryIds.length} 条库存`)
      }
    }
  }, [open, dispatch, linkedInventoryIds, form, getById, lockMany, loadYards])

  /** 从库存选择 Modal 确认回调 */
  const handlePickerConfirm = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setPickerOpen(false)
      return
    }
    lockMany(selectedIds)
    selectedIds.forEach((id) => lockedIdsRef.current.add(id))
    const newOnes: DispatchGoods[] = selectedIds
      .map(getById)
      .filter((inv): inv is NonNullable<ReturnType<typeof getById>> => Boolean(inv))
      .map((inv) => ({
        id: genId('goods'),
        dispatchId: 'temp',
        goodsName: inv.materialName,
        quantity: inv.quantity,
        unit: '箱',
        weight: inv.netWeight,
        customerName: inv.customerName,
        destination: inv.customerAddress,
        inventoryId: inv.id,
        // 从来源库存带入业务员（与库存录入人保持一致）
        salesPersonId: inv.salesPersonId,
        salesPersonName: inv.salesPersonName,
        // 从来源库存快照现货/等货 + 预计到货时间（创建时锁定，库存后续变更不影响）
        stockType: inv.stockType,
        expectedArrivalAt: inv.expectedArrivalAt,
        remark: `从库存 ${inv.id} 关联，订单类型：${ORDER_TYPE_LABEL[inv.orderType]}`,
      }))
    form.setFieldValue('_pendingGoods', [
      ...(form.getFieldValue('_pendingGoods') || []),
      ...newOnes,
    ])
    setPickerOpen(false)
    message.success(`已新增 ${selectedIds.length} 条货物`)
  }

  /** 取消 Drawer：解锁本次会话中所有未保存的库存 */
  const handleCancel = () => {
    if (lockedIdsRef.current.size) {
      unlock(Array.from(lockedIdsRef.current))
      lockedIdsRef.current.clear()
    }
    form.setFieldValue('_pendingGoods', [])
    onClose()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const id = dispatch?.id || genId('dispatch')
      const existing = useDispatchStore.getState().list.find((d) => d.id === id)
      const newDispatch: Dispatch = {
        id,
        dispatchNo: values.dispatchNo,
        status: values.status || 'pending_confirm',
        direction: values.direction,
        expectedLoadTime: values.expectedLoadTime?.format('YYYY-MM-DD HH:mm:ss') || '',
        remark: values.remark,
        creatorId: dispatch?.creatorId || currentUser?.id || '',
        creatorName: dispatch?.creatorName || currentUser?.realName || '',
        companyId: values.companyId,
        companyName: companies.find((c) => c.id === values.companyId)?.name || '',
        yardIds: values.yardIds || [],
        primaryYardId: values.primaryYardId,
        shippingMethod: values.shippingMethod,
        truckSize: values.truckSize,
        isCarpool: !!values.isCarpool,
        isUrgent: !!values.isUrgent,
        goods: existing?.goods || [],
        createdAt: existing?.createdAt || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ...(existing || {}),
      } as Dispatch
      // 重新设置，因为 spread 会覆盖
      // 修复 bug：合并 _pendingGoods（关联库存预填的货物）进新 dispatch
      const pending = form.getFieldValue('_pendingGoods') || []
      newDispatch.goods = [...(existing?.goods || []), ...pending]
      await save(newDispatch)
      // 保存成功：保留锁定状态，清空临时
      form.setFieldValue('_pendingGoods', [])
      lockedIdsRef.current.clear()
      message.success(dispatch ? '编辑成功' : '创建成功')
      onClose()
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return
      message.error('操作失败')
    }
  }

  /** 批量删除选中的货物 */
  const handleBatchRemoveGoods = () => {
    if (selectedGoodsKeys.length === 0) {
      message.warning('请先选择要删除的货物')
      return
    }
    const dispatchId = dispatch?.id || 'temp'
    const current = useDispatchStore.getState().list.find((d) => d.id === dispatchId)
    const allGoods = current?.goods || form.getFieldValue('_pendingGoods') || []
    const toRemoveIds = new Set(selectedGoodsKeys as string[])

    // 解锁被删的库存
    allGoods
      .filter((g: DispatchGoods) => toRemoveIds.has(g.id))
      .forEach((g: DispatchGoods) => {
        if (g.inventoryId && lockedIdsRef.current.has(g.inventoryId)) {
          unlock([g.inventoryId])
          lockedIdsRef.current.delete(g.inventoryId)
        }
      })

    if (current) {
      save({ ...current, goods: current.goods.filter((g) => !toRemoveIds.has(g.id)) })
    } else {
      form.setFieldValue(
        '_pendingGoods',
        (form.getFieldValue('_pendingGoods') || []).filter(
          (g: DispatchGoods) => !toRemoveIds.has(g.id),
        ),
      )
    }
    setSelectedGoodsKeys([])
    message.success(`已删除 ${selectedGoodsKeys.length} 条货物`)
  }

  const handleRemoveGoods = async (gid: string) => {
    const dispatchId = dispatch?.id || 'temp'
    const current = useDispatchStore.getState().list.find((d) => d.id === dispatchId)
    // 找到被删除的货物：来自库存 + 本次会话已锁 → 解锁
    const allGoods = current?.goods || form.getFieldValue('_pendingGoods') || []
    const removed = allGoods.find((g: DispatchGoods) => g.id === gid)
    if (removed?.inventoryId && lockedIdsRef.current.has(removed.inventoryId)) {
      unlock([removed.inventoryId])
      lockedIdsRef.current.delete(removed.inventoryId)
    }
    if (current) {
      await save({ ...current, goods: current.goods.filter((g) => g.id !== gid) })
    } else {
      const pending = (form.getFieldValue('_pendingGoods') || []).filter(
        (g: DispatchGoods) => g.id !== gid,
      )
      form.setFieldValue('_pendingGoods', pending)
    }
  }

  const currentGoods =
    useDispatchStore.getState().list.find((d) => d.id === dispatch?.id)?.goods ||
    form.getFieldValue('_pendingGoods') ||
    []

  // 关联库存的提示信息（仅主库存中第一个）
  const linkedInventory = linkedInventoryIds?.[0] ? getById(linkedInventoryIds[0]) : null

  // 当前 Drawer 中已占用的库存 id（用于 InventoryPickerModal 排除已选项）
  const excludedInventoryIds: string[] = [
    ...(linkedInventoryIds || []),
    ...(form.getFieldValue('_pendingGoods') || [])
      .map((g: DispatchGoods) => g.inventoryId)
      .filter(Boolean) as string[],
  ]

  return (
    <Modal
      title={dispatch ? `编辑调车单 - ${dispatch.dispatchNo}` : '新建调车单'}
      open={open}
      onCancel={handleCancel}
      width={1100}
      centered
      footer={[
        <Button key="cancel" onClick={handleCancel}>取消</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          保存
        </Button>,
      ]}
      destroyOnClose
    >
      {linkedInventory && (
        <Alert
          icon={<LinkOutlined />}
          message={
            linkedInventoryIds && linkedInventoryIds.length > 1
              ? `已从 ${linkedInventoryIds.length} 条库存发起`
              : `已从库存 ${linkedInventory.id} 关联`
          }
          description="货物信息已预填，对应库存已自动锁定为「已锁定」状态。可点击【+ 从库存选择】继续添加。请补充物流公司、园区、装货时间等信息后保存。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dispatchNo" label="调车编号" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'pending_confirm', label: '待确认' },
                  { value: 'confirmed', label: '已确认' },
                  { value: 'cancelled', label: '已取消' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="shippingMethod" label="发运方式" rules={[{ required: true, message: '请选择发运方式' }]}>
              <Select options={SHIPPING_METHOD_OPTIONS} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="truckSize"
              label="车型"
              rules={[{ required: needTruckSize(shippingMethodWatch), message: '该发运方式必须选择车型' }]}
            >
              <Select
                placeholder={needTruckSize(shippingMethodWatch) ? '请选择车型' : '仅大车/小车需选车型'}
                disabled={!needTruckSize(shippingMethodWatch)}
                options={getAvailableTruckSizes(shippingMethodWatch).map((s) => ({ value: s, label: s }))}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="yardIds" label="园区（可多选）" rules={[{ required: true, message: '请至少选择一个园区' }]}>
              <Select
                mode="multiple"
                placeholder="如：秦壁、甘亭"
                options={yards.map((y) => ({ value: y.id, label: y.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="primaryYardId"
              label="优先入场园区"
              rules={[{ required: true, message: '请选择优先入场园区' }]}
            >
              <Select
                placeholder="请先选园区"
                disabled={yardIdsWatch.length === 0}
                options={yardIdsWatch.map((id) => ({
                  value: id,
                  label: yards.find((y) => y.id === id)?.name || id,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="direction" label="服务方向" rules={[{ required: true }]}>
              <AutoComplete
                placeholder="如：上海 / 杭州 / 苏州"
                options={Array.from(
                  new Set(companies.flatMap((c) => parseCities(c.directions))),
                ).map((c) => ({ value: c }))}
                filterOption={(input, option) =>
                  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(v) => {
                  // 已选中的 companyId 不再匹配 → 自动清空
                  const selectedId = form.getFieldValue('companyId')
                  const cities = parseCities(v)
                  const stillMatch =
                    !selectedId ||
                    companies.some(
                      (c) =>
                        c.id === selectedId &&
                        cities.some((city) => parseCities(c.directions).includes(city)),
                    )
                  if (!stillMatch) form.setFieldValue('companyId', undefined)
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyId" label="物流公司" rules={[{ required: true }]}>
              <Select
                placeholder={availableCompanies.length ? '请选择' : '请先选择方向'}
                disabled={availableCompanies.length === 0}
                options={availableCompanies.map((c) => ({
                  value: c.id,
                  label: `${c.name}（${formatCities(parseCities(c.directions))} / 约${c.estimatedHours}h）`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="expectedLoadTime"
              label="期望装货时间（需求到场时间）"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="其他选项">
              <Space size={16}>
                <Form.Item name="isCarpool" valuePropName="checked" noStyle>
                  <Checkbox>拼车</Checkbox>
                </Form.Item>
                <Form.Item name="isUrgent" valuePropName="checked" noStyle>
                  <Checkbox disabled={!isAdmin}>紧急（无视限制）</Checkbox>
                </Form.Item>
              </Space>
            </Form.Item>
          </Col>
        </Row>
        {validation.reason && (
          <Alert
            icon={<ExclamationCircleOutlined />}
            message="调度规则提示"
            description={validation.reason}
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
      </Form>

<div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '16px 0 12px',
          padding: '0 0 8px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          货物清单（来源于【库存管理】）
          <span style={{ marginLeft: 8, color: '#999', fontWeight: 'normal' }}>
            共 {currentGoods.length} 条
          </span>
        </span>
        {!dispatch && (
          <Space>
            {currentGoods.length > 0 && (
              <Button
                danger
                disabled={selectedGoodsKeys.length === 0}
                onClick={handleBatchRemoveGoods}
              >
                批量删除{selectedGoodsKeys.length > 0 ? ` (${selectedGoodsKeys.length})` : ''}
              </Button>
            )}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setPickerOpen(true)}
            >
              从库存选择
            </Button>
          </Space>
        )}
      </div>

      {currentGoods.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          暂无货物，请点击右上【+ 从库存选择】添加
        </div>
      ) : (
        <Table<DispatchGoods>
          rowKey="id"
          size="small"
          dataSource={currentGoods}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedGoodsKeys,
            onChange: setSelectedGoodsKeys,
            preserveSelectedRowKeys: false,
          }}
          columns={[
            {
              title: '货物',
              dataIndex: 'goodsName',
              width: 320,
              render: (n: string, g: DispatchGoods) => {
                const inv = g.inventoryId ? getById(g.inventoryId) : null
                return (
                  <div>
                    <div>
                      <b>{n}</b> × {g.quantity}
                      {g.unit}
                      {g.inventoryId && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>来源 {g.inventoryId}</Tag>
                      )}
                    </div>
                    {inv && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {inv.yardName && <Tag color="cyan" style={{ marginRight: 4 }}>{inv.yardName}</Tag>}
                        {inv.category && <Tag style={{ marginRight: 4 }}>{inv.category === 'rough' ? '毛坯' : '加工件'}</Tag>}
                        {inv.totalQuantity !== undefined && (
                          <span style={{ marginRight: 8 }}>共 {inv.totalQuantity} 件</span>
                        )}
                        {inv.drawingNo && <span>图号 {inv.drawingNo}</span>}
                      </div>
                    )}
                  </div>
                )
              },
            },
            {
              title: '净重(kg)',
              dataIndex: 'weight',
              width: 100,
              render: (w: number, g: DispatchGoods) => {
                const inv = g.inventoryId ? getById(g.inventoryId) : null
                return inv?.netWeight ?? w ?? '-'
              },
            },
            { title: '客户', dataIndex: 'customerName', width: 140, ellipsis: true },
            {
              // 与「创建人」明确区分：本列显示该货物来源库存的录入业务员
              title: '库存业务员',
              dataIndex: 'salesPersonName',
              width: 110,
              render: (v: string | undefined, g: DispatchGoods) => {
                if (!v) return <span style={{ color: '#ccc' }}>-</span>
                const fromInventory = !!g.inventoryId
                return (
                  <Tooltip title={fromInventory ? `来自库存 ${g.inventoryId}` : '手工录入（取当前用户）'}>
                    <Tag color={fromInventory ? 'blue' : 'default'}>{v}</Tag>
                  </Tooltip>
                )
              },
            },
            {
              title: '现货/等货',
              dataIndex: 'stockType',
              width: 100,
              render: (v: string | undefined) => {
                if (!v) return <span style={{ color: '#ccc' }}>-</span>
                const isWaiting = v === 'waiting'
                return (
                  <Tag color={isWaiting ? 'orange' : 'green'}>
                    {STOCK_TYPE_LABEL[v as keyof typeof STOCK_TYPE_LABEL] ?? v}
                  </Tag>
                )
              },
            },
            {
              title: '预计到货时间',
              dataIndex: 'expectedArrivalAt',
              width: 130,
              render: (v: string | undefined, g: { stockType?: string }) => {
                if (g.stockType !== 'waiting' || !v) return <span style={{ color: '#ccc' }}>-</span>
                return dayjs(v).format('YYYY-MM-DD')
              },
            },
            { title: '目的地', dataIndex: 'destination', width: 160, ellipsis: true },
            {
              title: '操作',
              width: 80,
              render: (_, g: DispatchGoods) => (
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => handleRemoveGoods(g.id)}
                >
                  删除
                </Button>
              ),
            },
          ]}
        />
      )}

      <InventoryPickerModal
        open={pickerOpen}
        excludeIds={excludedInventoryIds}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />
    </Modal>
  )
}
