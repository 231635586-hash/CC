import { useState } from 'react'
import { Drawer, Steps, Button, Upload, Table, Tag, Modal, Space, message, Alert } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { useInventoryStore, useCustomerStore, useDictStore } from '@/stores'
import type {
  InventoryImportRow,
  ValidatedRow,
  OrderType,
  PackagingType,
  MaterialCategory,
  StockType,
} from '@/types/inventory'
import {
  MATERIAL_CATEGORY_LABEL,
  STOCK_TYPE_LABEL,
  ORDER_TYPE_LABEL,
  PACKAGING_LABEL,
} from '@/types/inventory'
import styles from './InventoryImportDrawer.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/** 必填字段（按用户确认：归属/客户名称/发货地/类别/物料编码/产品名称/图号/单箱数量/箱数/单重/箱重/净重/单箱隔板重/隔板总重/吨位/现货） */
const REQUIRED_FIELDS = [
  '归属',
  '客户名称',
  '发货地',
  '类别',
  '物料编码',
  '产品名称',
  '图号',
  '单箱数量',
  '箱数',
  '单重(kg)',
  '箱重(kg)',
  '净重(kg)',
  '单箱隔板重(kg)',
  '隔板总重(kg)',
  '吨位/车',
  '现货/等货',
]

/** 模板表头顺序 */
const TEMPLATE_HEADERS = [
  '归属', '客户编号', '客户名称', '发货地',
  '类别', '物料编码', '产品名称', '图号',
  '单箱数量', '箱数', '单重(kg)', '箱重(kg)', '净重(kg)',
  '单箱隔板重(kg)', '隔板总重(kg)', '吨位/车', '现货/等货', '预计到货时间',
  '客户物料编码', '条码编号', '生产编号',
  '订单类型', '包装类型', '库龄(天)', '备注',
]

// Excel 显示标签 → TS 枚举值 的映射
const CATEGORY_VALUE_MAP: Record<string, MaterialCategory> = {
  毛坯: 'rough',
  加工件: 'processed',
}

const STOCK_TYPE_VALUE_MAP: Record<string, StockType> = {
  现货: 'in_stock_now',
  等货: 'waiting',
}

const ORDER_TYPE_VALUE_MAP: Record<string, OrderType> = {
  毛坯自用: 'rough_self_use',
  正常订单: 'normal',
  样品订单: 'sample',
  退货入库: 'return',
}

const PACKAGING_VALUE_MAP: Record<string, PackagingType> = {
  吨袋: 'ton_bag',
  '中集UB-108': 'zhongji_ub108',
  木箱: 'wooden_box',
}

export function InventoryImportDrawer({ open, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState(0)
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [importing, setImporting] = useState(false)
  const { importBatch, getByBarcode } = useInventoryStore()
  const { list: customers } = useCustomerStore()
  const { yards } = useDictStore()

  const reset = () => {
    setCurrent(0)
    setValidatedRows([])
    setImporting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  /** 园区名称 → yardId */
  const yardNameToId = (name: string): string | undefined => {
    const hit = yards.find((y) => y.name === name && y.status === 'enabled')
    return hit?.id
  }

  const downloadTemplate = () => {
    const sampleYard = yards[0]?.name || '甘亭'
    const sampleCustomer = customers[0]?.name || '客户名称'
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [
        sampleYard, 'CUS-2026-001', sampleCustomer, '苏州',
        '毛坯', 'MAT-A001', '精密齿轮组件', 'DWG-A001-REV3',
        20, 50, 2.5, 55, 1370,
        1.5, 75, 10, '现货',
        'CUST-MAT-A001', 'BC202606240001', 'PRD-2026-0624-X',
        '正常订单', '木箱', 0, '示例备注',
      ],
    ])
    ws['!cols'] = TEMPLATE_HEADERS.map((h) => ({ wch: h.length > 8 ? 16 : 12 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '库存导入模板')
    XLSX.writeFile(wb, '库存导入模板.xlsx')
  }

  const parseExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

        const validated: ValidatedRow[] = json.map((row, idx) => {
          const errors: string[] = []

          // 归属（园区名称 → yardId）
          const yardName = String(row['归属'] || '').trim()
          const yardId = yardName ? yardNameToId(yardName) : undefined
          if (!yardName) errors.push('归属必填')
          else if (!yardId) errors.push(`归属【${yardName}】不存在或未启用`)

          // 客户编号（可选）
          const customerCode = String(row['客户编号'] || '').trim() || undefined
          const customerName = String(row['客户名称'] || '').trim()
          if (!customerName) errors.push('客户名称必填')

          const shippingFrom = String(row['发货地'] || '').trim()
          if (!shippingFrom) errors.push('发货地必填')

          // 类别
          const categoryLabel = String(row['类别'] || '').trim()
          const category = CATEGORY_VALUE_MAP[categoryLabel]
          if (!categoryLabel) errors.push('类别必填')
          else if (!category) errors.push(`类别【${categoryLabel}】只能填 毛坯 / 加工件`)

          const materialCode = String(row['物料编码'] || '').trim()
          if (!materialCode) errors.push('物料编码必填')
          const productName = String(row['产品名称'] || '').trim()
          if (!productName) errors.push('产品名称必填')
          const drawingNo = String(row['图号'] || '').trim()
          if (!drawingNo) errors.push('图号必填')

          // 数值字段
          const numField = (name: string, min = 0, mustInteger = false): number | undefined => {
            const raw = row[name]
            if (raw === '' || raw == null) return undefined
            const n = Number(raw)
            if (!Number.isFinite(n)) return undefined
            return n
          }
          const quantityPerBox = numField('单箱数量', 1, true)
          const quantity = numField('箱数', 1, true)
          const unitWeight = numField('单重(kg)', 0)
          const boxWeight = numField('箱重(kg)', 0)
          const netWeight = numField('净重(kg)', 0)
          const partitionWeightPerBox = numField('单箱隔板重(kg)', 0)
          const partitionTotalWeight = numField('隔板总重(kg)', 0)
          const tonnagePerVehicle = numField('吨位/车', 0)

          if (quantityPerBox === undefined) errors.push('单箱数量必填')
          else if (quantityPerBox < 1) errors.push('单箱数量必须 ≥ 1')
          if (quantity === undefined) errors.push('箱数必填')
          else if (quantity < 1) errors.push('箱数必须 ≥ 1')
          if (unitWeight === undefined) errors.push('单重(kg)必填')
          else if (unitWeight < 0) errors.push('单重(kg)不能为负')
          if (boxWeight === undefined) errors.push('箱重(kg)必填')
          else if (boxWeight < 0) errors.push('箱重(kg)不能为负')
          if (netWeight === undefined) errors.push('净重(kg)必填')
          else if (netWeight < 0) errors.push('净重(kg)不能为负')
          if (partitionWeightPerBox === undefined) errors.push('单箱隔板重(kg)必填')
          else if (partitionWeightPerBox < 0) errors.push('单箱隔板重(kg)不能为负')
          if (partitionTotalWeight === undefined) errors.push('隔板总重(kg)必填')
          else if (partitionTotalWeight < 0) errors.push('隔板总重(kg)不能为负')
          if (tonnagePerVehicle === undefined) errors.push('吨位/车必填')
          else if (tonnagePerVehicle < 0) errors.push('吨位/车不能为负')

          // 现货/等货
          const stockTypeLabel = String(row['现货/等货'] || '').trim()
          const stockType = STOCK_TYPE_VALUE_MAP[stockTypeLabel]
          if (!stockTypeLabel) errors.push('现货/等货必填')
          else if (!stockType) errors.push(`现货/等货【${stockTypeLabel}】只能填 现货 / 等货`)

          // 预计到货时间（仅等货时必填；Excel 日期序列号 → ISO 字符串）
          const expectedArrivalRaw = row['预计到货时间']
          let expectedArrivalAt: string | undefined = undefined
          if (expectedArrivalRaw !== '' && expectedArrivalRaw != null) {
            // xlsx 解析后日期可能是 number(Excel序列号) 或 string(YYYY-MM-DD 或 YYYY/MM/DD)
            if (typeof expectedArrivalRaw === 'number') {
              // Excel 序列号：转 JS Date 再格式化
              const ms = (expectedArrivalRaw - 25569) * 86400 * 1000
              expectedArrivalAt = new Date(ms).toISOString()
            } else {
              const str = String(expectedArrivalRaw).trim()
              // 接受 YYYY-MM-DD 或 YYYY/MM/DD 格式
              const m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
              if (m) {
                const [, y, mo, d] = m
                expectedArrivalAt = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`
              } else {
                errors.push(`预计到货时间【${str}】格式错误（请填 YYYY-MM-DD）`)
              }
            }
            // 校验必须 ≥ 今天
            if (expectedArrivalAt) {
              const arrival = new Date(expectedArrivalAt)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              if (arrival < today) errors.push('预计到货时间不能早于今天')
            }
          }
          if (stockType === 'waiting' && !expectedArrivalAt) {
            errors.push('等货状态必须填写预计到货时间')
          }

          // 订单类型 / 包装（可选）
          const orderTypeLabel = String(row['订单类型'] || '').trim()
          const orderType = orderTypeLabel ? ORDER_TYPE_VALUE_MAP[orderTypeLabel] : 'normal'
          if (orderTypeLabel && !orderType) errors.push(`订单类型【${orderTypeLabel}】不在可选范围内`)

          const packagingLabel = String(row['包装类型'] || '').trim()
          const packaging = packagingLabel ? PACKAGING_VALUE_MAP[packagingLabel] : undefined
          if (packagingLabel && !packaging) errors.push(`包装类型【${packagingLabel}】不在可选范围内`)

          const ageRaw = row['库龄(天)']
          const age = ageRaw !== '' && ageRaw != null ? Number(ageRaw) : undefined
          if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 9999)) {
            errors.push('库龄必须在 0-9999 之间')
          }

          // 条码必填
          const barcode = String(row['条码编号'] || '').trim()
          if (!barcode) errors.push('条码编号必填')

          // 客户存在性校验
          if (customerName && !customers.find((c) => c.name === customerName && c.status === 'active')) {
            errors.push(`客户【${customerName}】不存在或已停用`)
          }

          // 总数自动计算
          const totalQuantity =
            typeof quantityPerBox === 'number' && typeof quantity === 'number'
              ? quantityPerBox * quantity
              : undefined

          const hasErrors = errors.length > 0
          const existingRecord = !hasErrors && barcode ? getByBarcode(barcode) : undefined

          const importRow: InventoryImportRow = {
            barcode,
            productionNo: String(row['生产编号'] || '').trim() || undefined,
            yardName: yardName || undefined,
            category,
            materialCode,
            materialName: productName,
            productName,
            drawingNo: drawingNo || undefined,
            customerCode,
            customerName,
            shippingFrom: shippingFrom || undefined,
            customerMaterialCode: String(row['客户物料编码'] || '').trim() || undefined,
            orderType: orderType || 'normal',
            quantityPerBox,
            quantity: typeof quantity === 'number' ? quantity : 0,
            totalQuantity,
            unitWeight,
            boxWeight,
            netWeight,
            partitionWeightPerBox,
            partitionTotalWeight,
            tonnagePerVehicle,
            stockType,
            expectedArrivalAt,
            packaging,
            age,
            remark: String(row['备注'] || '').trim() || undefined,
          }

          let status: ValidatedRow['status']
          if (hasErrors) status = 'invalid'
          else if (existingRecord) status = 'duplicate'
          else status = 'valid'

          return {
            rowIndex: idx + 2,
            raw: importRow,
            status,
            errors,
            existingRecordId: existingRecord?.id,
          }
        })

        setValidatedRows(validated)
        setCurrent(1)
      } catch (err) {
        message.error('Excel 解析失败：' + (err as Error).message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const stats = {
    total: validatedRows.length,
    valid: validatedRows.filter((r) => r.status === 'valid').length,
    invalid: validatedRows.filter((r) => r.status === 'invalid').length,
    duplicate: validatedRows.filter((r) => r.status === 'duplicate').length,
  }

  const handleImport = async (mode: 'overwrite' | 'skip') => {
    const rowsToImport = validatedRows.filter(
      (r) => r.status === 'valid' || (mode === 'overwrite' && r.status === 'duplicate'),
    )
    if (rowsToImport.length === 0) {
      message.warning('没有可导入的行')
      return
    }

    setImporting(true)
    try {
      const result = importBatch(rowsToImport, mode)
      message.success(
        `导入完成：新增 ${result.imported} 条，覆盖 ${result.overwritten} 条，跳过 ${result.skipped} 条`,
      )
      onSuccess()
      handleClose()
    } catch (err) {
      message.error('导入失败：' + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const downloadErrorReport = () => {
    const errors = validatedRows.filter((r) => r.status === 'invalid')
    const ws = XLSX.utils.aoa_to_sheet([
      ['Excel 行号', '条码编号', '错误信息'],
      ...errors.map((r) => [r.rowIndex, r.raw.barcode, r.errors.join('; ')]),
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '错误报告')
    XLSX.writeFile(wb, '导入错误报告.xlsx')
  }

  return (
    <Drawer
      title="批量导入库存"
      open={open}
      onClose={handleClose}
      width={960}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={current}
        items={[{ title: '上传文件' }, { title: '校验预览' }, { title: '完成' }]}
        className={styles.steps}
      />

      {current === 0 && (
        <div className={styles.stepContent}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
            className={styles.templateBtn}
          >
            下载 Excel 模板
          </Button>
          <Alert
            message={`必填字段（${REQUIRED_FIELDS.length} 列）：${REQUIRED_FIELDS.join('、')}`}
            description={`归属按园区名称匹配；类别可选：毛坯 / 加工件；现货/等货可选：现货 / 等货；订单类型可选：${Object.keys(ORDER_TYPE_VALUE_MAP).join('、')}；包装类型可选：${Object.keys(PACKAGING_VALUE_MAP).join('、')}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Upload.Dragger
            name="file"
            accept=".xlsx,.xls"
            beforeUpload={(file) => {
              parseExcel(file)
              return false
            }}
            showUploadList={false}
            className={styles.uploadArea}
          >
            <p><InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} /></p>
            <p>点击或拖拽 .xlsx 文件到此区域</p>
            <p className={styles.uploadHint}>仅支持 Excel 2007+ 格式（.xlsx）</p>
          </Upload.Dragger>
        </div>
      )}

      {current === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.summary}>
            <span className={styles.summaryItem}>
              <span className={styles.summaryCount} style={{ color: '#52c41a' }}>{stats.valid}</span>有效
            </span>
            <span className={styles.summaryItem}>
              <span className={styles.summaryCount} style={{ color: '#faad14' }}>{stats.duplicate}</span>重复
            </span>
            <span className={styles.summaryItem}>
              <span className={styles.summaryCount} style={{ color: '#f5222d' }}>{stats.invalid}</span>错误
            </span>
            <span className={styles.summaryItem}>
              <span className={styles.summaryCount}>{stats.total}</span>总计
            </span>
          </div>

          {stats.invalid > 0 && (
            <Alert
              message={`有 ${stats.invalid} 行错误，无法导入。请修正后重新上传。`}
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              action={<Button size="small" onClick={downloadErrorReport}>下载错误报告</Button>}
            />
          )}

          <Table
            rowKey="rowIndex"
            dataSource={validatedRows}
            pagination={{ pageSize: 20 }}
            size="small"
            scroll={{ y: 400 }}
            columns={[
              { title: 'Excel 行', dataIndex: 'rowIndex', width: 80 },
              { title: '归属', dataIndex: ['raw', 'yardName'], width: 90 },
              { title: '物料编码', dataIndex: ['raw', 'materialCode'], width: 110 },
              { title: '产品名称', dataIndex: ['raw', 'productName'], width: 140, ellipsis: true },
              {
                title: '类别',
                dataIndex: ['raw', 'category'],
                width: 80,
                render: (v: MaterialCategory | undefined) => (v ? MATERIAL_CATEGORY_LABEL[v] : '-'),
              },
              { title: '客户', dataIndex: ['raw', 'customerName'], width: 150, ellipsis: true },
              { title: '数量(箱)', dataIndex: ['raw', 'quantity'], width: 90, align: 'right' },
              {
                title: '现货/等货',
                dataIndex: ['raw', 'stockType'],
                width: 90,
                render: (v: StockType | undefined) => (v ? STOCK_TYPE_LABEL[v] : '-'),
              },
              {
                title: '预计到货时间',
                dataIndex: ['raw', 'expectedArrivalAt'],
                width: 120,
                render: (v: string | undefined) =>
                  v ? v.slice(0, 10) : '-',
              },
              {
                title: '校验结果',
                width: 90,
                render: (_, r) => {
                  if (r.status === 'valid') return <Tag color="green">✓ 有效</Tag>
                  if (r.status === 'duplicate') return <Tag color="orange">⚠ 重复</Tag>
                  return <Tag color="red">✗ 错误</Tag>
                },
              },
              {
                title: '错误信息',
                render: (_, r) => (r.errors.length > 0 ? (
                  <span style={{ color: '#f5222d' }}>{r.errors.join('；')}</span>
                ) : '-'),
              },
            ]}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setCurrent(0); setValidatedRows([]) }}>重新上传</Button>
              {stats.duplicate > 0 && (
                <Button onClick={() => handleImport('skip')} loading={importing}>
                  跳过重复行，导入其余
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => {
                  if (stats.duplicate > 0) {
                    Modal.confirm({
                      title: `检测到 ${stats.duplicate} 行条码重复`,
                      content: '导入后将覆盖当前数据，是否继续？',
                      okText: '确认覆盖并导入',
                      okButtonProps: { danger: true },
                      onOk: () => handleImport('overwrite'),
                    })
                  } else {
                    handleImport('overwrite')
                  }
                }}
                disabled={stats.valid === 0 && stats.duplicate === 0}
                loading={importing}
              >
                {stats.duplicate > 0 ? `覆盖 ${stats.duplicate} 行并导入` : '确认导入'}
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Drawer>
  )
}