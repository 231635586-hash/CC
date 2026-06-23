import { useState } from 'react'
import { Drawer, Steps, Button, Upload, Table, Tag, Modal, Space, message, Alert } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { useInventoryStore, useCustomerStore } from '@/stores'
import type { InventoryImportRow, ValidatedRow, OrderType, PackagingType } from '@/types/inventory'
import { ORDER_TYPE_LABEL, PACKAGING_LABEL } from '@/types/inventory'
import styles from './InventoryImportDrawer.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const REQUIRED_FIELDS = ['条码编号', '物料编码', '物料名称', '客户名称', '订单类型', '数量(箱)']

const TEMPLATE_HEADERS = [
  '条码编号', '生产编号', '物料编码', '物料名称', '物料图号',
  '客户名称', '订单类型', '单件净重(kg)', '单箱货重(kg)',
  '数量(箱)', '包装类型', '库龄(天)', '备注',
]

// Excel 显示标签 → TS 枚举值 的映射
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

  const reset = () => {
    setCurrent(0)
    setValidatedRows([])
    setImporting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      // 示例行
      ['BC202606240001', 'PRD-2026-0624-X', 'MAT-A001', '精密齿轮组件', 'DWG-A001-REV3',
        customers[0]?.name || '客户名称', '正常订单', 2.5, 25, 50, '木箱', 0, '示例备注'],
    ])
    ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 16 }))
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
          const orderTypeLabel = String(row['订单类型'] || '').trim()
          const orderType = ORDER_TYPE_VALUE_MAP[orderTypeLabel]

          const packagingLabel = String(row['包装类型'] || '').trim()
          const packaging = packagingLabel ? PACKAGING_VALUE_MAP[packagingLabel] : undefined

          const quantity = Number(row['数量(箱)'])
          const netWeight = row['单件净重(kg)'] !== '' && row['单件净重(kg)'] != null ? Number(row['单件净重(kg)']) : undefined
          const weightPerBox = row['单箱货重(kg)'] !== '' && row['单箱货重(kg)'] != null ? Number(row['单箱货重(kg)']) : undefined
          const age = row['库龄(天)'] !== '' && row['库龄(天)'] != null ? Number(row['库龄(天)']) : undefined

          // 必填校验
          if (!String(row['条码编号'] || '').trim()) errors.push('条码编号必填')
          if (!String(row['物料编码'] || '').trim()) errors.push('物料编码必填')
          if (!String(row['物料名称'] || '').trim()) errors.push('物料名称必填')
          if (!String(row['客户名称'] || '').trim()) errors.push('客户名称必填')
          if (!orderTypeLabel) errors.push('订单类型必填')
          else if (!orderType) errors.push(`订单类型【${orderTypeLabel}】不在可选范围内`)

          // 数值校验
          if (!Number.isFinite(quantity) || quantity <= 0) errors.push('数量必须为正整数')
          if (netWeight !== undefined && (!Number.isFinite(netWeight) || netWeight < 0)) errors.push('单件净重必须为正数')
          if (weightPerBox !== undefined && (!Number.isFinite(weightPerBox) || weightPerBox < 0)) errors.push('单箱货重必须为正数')
          if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 9999)) errors.push('库龄必须在 0-9999 之间')

          // 包装类型校验
          if (packagingLabel && !packaging) errors.push(`包装类型【${packagingLabel}】不在可选范围内`)

          // 客户存在性校验
          const customerName = String(row['客户名称'] || '').trim()
          if (customerName && !customers.find((c) => c.name === customerName && c.status === 'active')) {
            errors.push(`客户【${customerName}】不存在或已停用`)
          }

          const hasErrors = errors.length > 0
          const existingRecord = !hasErrors ? getByBarcode(String(row['条码编号'] || '').trim()) : undefined

          const importRow: InventoryImportRow = {
            barcode: String(row['条码编号'] || '').trim(),
            productionNo: String(row['生产编号'] || '').trim() || undefined,
            materialCode: String(row['物料编码'] || '').trim(),
            materialName: String(row['物料名称'] || '').trim(),
            materialDrawingNo: String(row['物料图号'] || '').trim() || undefined,
            customerName,
            orderType: orderType || 'normal',
            netWeightPerPiece: netWeight,
            weightPerBox,
            quantity: Number.isFinite(quantity) ? quantity : 0,
            packaging,
            age,
            remark: String(row['备注'] || '').trim() || undefined,
          }

          let status: ValidatedRow['status']
          if (hasErrors) status = 'invalid'
          else if (existingRecord) status = 'duplicate'
          else status = 'valid'

          return {
            rowIndex: idx + 2, // Excel 行号（含表头）
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
      (r) => r.status === 'valid' || (mode === 'overwrite' && r.status === 'duplicate')
    )
    if (rowsToImport.length === 0) {
      message.warning('没有可导入的行')
      return
    }

    setImporting(true)
    try {
      const result = importBatch(rowsToImport, mode)
      message.success(
        `导入完成：新增 ${result.imported} 条，覆盖 ${result.overwritten} 条，跳过 ${result.skipped} 条`
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
            description={`订单类型可选：${Object.keys(ORDER_TYPE_VALUE_MAP).join('、')}；包装类型可选：${Object.keys(PACKAGING_VALUE_MAP).join('、')}`}
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
              { title: '条码', dataIndex: ['raw', 'barcode'], width: 130 },
              { title: '物料编码', dataIndex: ['raw', 'materialCode'], width: 100 },
              { title: '客户', dataIndex: ['raw', 'customerName'], width: 150, ellipsis: true },
              { title: '数量', dataIndex: ['raw', 'quantity'], width: 70 },
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
                render: (_, r) => r.errors.length > 0 ? (
                  <span style={{ color: '#f5222d' }}>{r.errors.join('；')}</span>
                ) : '-',
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
