import { useState } from 'react'
import { Drawer, Steps, Button, Upload, Table, Tag, Modal, Space, message, Alert } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { useCustomerStore, type CustomerImportRow } from '@/stores/customer'
import { CUSTOMER_STATUS_LABEL } from '@/types/customer'
import type { CustomerStatus } from '@/types/customer'
import styles from './CustomerImportDrawer.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ValidatedRow {
  rowIndex: number
  raw: CustomerImportRow
  status: 'valid' | 'duplicate' | 'invalid'
  errors: string[]
  existingRecordId?: string
}

const REQUIRED_FIELDS = ['客户名称', '客户地址']

const TEMPLATE_HEADERS = ['客户名称', '客户地址', '联系人', '联系电话', '状态', '备注']

// Excel 显示标签 → TS 枚举值 的映射
const STATUS_VALUE_MAP: Record<string, CustomerStatus> = {
  启用: 'active',
  停用: 'inactive',
}

export function CustomerImportDrawer({ open, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState(0)
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [importing, setImporting] = useState(false)
  const { importBatch, getByName, list } = useCustomerStore()

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
      ['示例客户科技有限公司', '上海市浦东新区张江路 100 号', '张三', '13900000000', '启用', '示例备注'],
    ])
    ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '客户导入模板')
    XLSX.writeFile(wb, '客户导入模板.xlsx')
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

          const name = String(row['客户名称'] || '').trim()
          const address = String(row['客户地址'] || '').trim()
          const contact = String(row['联系人'] || '').trim()
          const phone = String(row['联系电话'] || '').trim()
          const statusLabel = String(row['状态'] || '').trim()
          const remark = String(row['备注'] || '').trim()

          // 必填校验
          if (!name) errors.push('客户名称必填')
          if (!address) errors.push('客户地址必填')

          // 状态校验
          let status: CustomerStatus | undefined
          if (statusLabel) {
            status = STATUS_VALUE_MAP[statusLabel]
            if (!status) errors.push(`状态【${statusLabel}】不在可选范围内（启用/停用）`)
          }

          // 电话格式校验（可选）
          if (phone && !/^[\d\-\s]{5,20}$/.test(phone)) {
            errors.push('联系电话格式不正确')
          }

          const hasErrors = errors.length > 0
          const existingRecord = !hasErrors ? getByName(name) : undefined

          const importRow: CustomerImportRow = {
            name,
            address,
            contact: contact || undefined,
            phone: phone || undefined,
            status: status ?? 'active',
            remark: remark || undefined,
          }

          let rowStatus: ValidatedRow['status']
          if (hasErrors) rowStatus = 'invalid'
          else if (existingRecord) rowStatus = 'duplicate'
          else rowStatus = 'valid'

          return {
            rowIndex: idx + 2, // Excel 行号（含表头）
            raw: importRow,
            status: rowStatus,
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
      const result = importBatch(rowsToImport.map((r) => r.raw), mode)
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
      ['Excel 行号', '客户名称', '错误信息'],
      ...errors.map((r) => [r.rowIndex, r.raw.name, r.errors.join('; ')]),
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '错误报告')
    XLSX.writeFile(wb, '客户导入错误报告.xlsx')
  }

  return (
    <Drawer
      title="批量导入客户"
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
            description={
              <>
                状态可选：{Object.keys(STATUS_VALUE_MAP).join('、')}（默认启用）；系统当前共 {list.length} 个客户；
                <b>添加人</b>由系统自动取当前登录用户，无需在 Excel 中填写。
              </>
            }
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
              { title: '客户名称', dataIndex: ['raw', 'name'], width: 200, ellipsis: true },
              { title: '地址', dataIndex: ['raw', 'address'], width: 200, ellipsis: true },
              { title: '联系人', dataIndex: ['raw', 'contact'], width: 100 },
              {
                title: '状态',
                dataIndex: ['raw', 'status'],
                width: 80,
                render: (s: CustomerStatus) => CUSTOMER_STATUS_LABEL[s],
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
                      title: `检测到 ${stats.duplicate} 行客户名称重复`,
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