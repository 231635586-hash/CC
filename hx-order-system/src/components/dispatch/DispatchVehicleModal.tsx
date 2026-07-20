/**
 * 派车 Modal（车辆 + 司机 + 调车员）
 *
 * 用途：原 OrderDetailPage / DispatchSchedulePage 各有一段相同 Form(车辆选择 + 司机选择 + 调车员备注)
 * 设计：自管 Form 状态，onOk 回调把校验后的 values 回传，由调用方做业务保存
 * 不耦合 store：vehicles / drivers 由调用方按当前 dispatch.companyId 过滤后传入
 *
 * 涉及的页面（已迁移 / 待迁移）：
 *  - OrderDetailPage          ✓ v0.8.x
 *  - DispatchSchedulePage     ◯ TODO（差异：顶部有 chip 摘要 + 公司名/方向/园区 Tag）
 */
import { useEffect } from 'react'
import { Modal, Form, Select } from 'antd'

export interface VehicleOption {
  id: string
  plateNo: string
  maxLoad?: number
  length?: number
}

export interface DriverOption {
  id: string
  name: string
  phone?: string
}

export interface DispatchValues {
  vehicleId: string
  driverId: string
  dispatcherName?: string
}

export interface DispatchVehicleModalProps {
  open: boolean
  /** 当前派车单编号（用于 Modal 标题） */
  dispatchNo?: string
  /** 可选车辆列表（已按 companyId/status 过滤） */
  vehicles: VehicleOption[]
  /** 可选司机列表（已按 companyId/status 过滤） */
  drivers: DriverOption[]
  /** 调车员可选值（默认「周文 / 吴峰」） */
  dispatcherOptions?: { value: string; label: string }[]
  /** 打开时回填值（用于「重新派车」场景预填上次选择） */
  initialValues?: Partial<DispatchValues>
  /** 点击确认 / 取消 */
  onCancel: () => void
  onOk: (values: DispatchValues) => void | Promise<void>
}

const DEFAULT_DISPATCHERS = [
  { value: '周文', label: '周文' },
  { value: '吴峰', label: '吴峰' },
]

/** 格式化「沪A12345（10t / 12m）」 */
function vehicleLabel(v: VehicleOption): string {
  const segs: string[] = [v.plateNo]
  if (v.maxLoad !== undefined) segs.push(`${v.maxLoad}t`)
  if (v.length !== undefined) segs.push(`${v.length}m`)
  return `${segs[0]}（${segs.slice(1).join(' / ')}）`
}

/** 格式化「张三（13800001111）」 */
function driverLabel(d: DriverOption): string {
  return d.phone ? `${d.name}（${d.phone}）` : d.name
}

export function DispatchVehicleModal(props: DispatchVehicleModalProps) {
  const {
    open,
    dispatchNo,
    vehicles,
    drivers,
    dispatcherOptions = DEFAULT_DISPATCHERS,
    initialValues,
    onCancel,
    onOk,
  } = props
  const [form] = Form.useForm<DispatchValues>()

  // 打开时回填 initialValues（覆盖上次未提交残留）
  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues ?? {})
    } else {
      form.resetFields()
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await onOk(values)
    } catch {
      // 校验失败由 antd 内部展示
    }
  }

  return (
    <Modal
      title={dispatchNo ? `派车 - ${dispatchNo}` : '派车'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认派车"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="vehicleId" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
          <Select
            placeholder="请选择车辆"
            showSearch
            optionFilterProp="label"
            options={vehicles.map((v) => ({ value: v.id, label: vehicleLabel(v) }))}
          />
        </Form.Item>
        <Form.Item name="driverId" label="选择司机" rules={[{ required: true, message: '请选择司机' }]}>
          <Select
            placeholder="请选择司机"
            showSearch
            optionFilterProp="label"
            options={drivers.map((d) => ({ value: d.id, label: driverLabel(d) }))}
          />
        </Form.Item>
        <Form.Item name="dispatcherName" label="调车员（备注）">
          <Select placeholder="可选" allowClear options={dispatcherOptions} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
