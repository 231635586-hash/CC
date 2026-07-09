import { ReactNode } from 'react'
import { Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import styles from './SearchForm.module.css'

interface SearchItem {
  name: string
  label: string
  type: 'input' | 'select' | 'date' | 'dateRange'
  options?: { label: string; value: string | number }[]
  placeholder?: string
  width?: number
}

interface SearchFormProps {
  items: SearchItem[]
  onSearch: (values: Record<string, unknown>) => void
  onReset?: () => void
  initialValues?: Record<string, unknown>
  extra?: ReactNode
}

/** 通用筛选表单 */
export function SearchForm({ items, onSearch, onReset, initialValues, extra }: SearchFormProps) {
  const [form] = Form.useForm()

  const handleReset = () => {
    form.resetFields()
    onReset?.()
    onSearch({})
  }

  return (
    <Form
      form={form}
      layout="inline"
      initialValues={initialValues}
      onFinish={onSearch}
      className={styles.form}
    >
      <Row gutter={[16, 12]} className={styles.row}>
        {items.map((item) => {
          const inputStyle = {
            '--search-input-width': `${item.width || 200}px`,
          } as React.CSSProperties

          return (
            <Col key={item.name}>
              <Form.Item name={item.name} label={item.label} className={styles.formItem}>
                {item.type === 'input' && (
                  <Input
                    placeholder={item.placeholder || `请输入${item.label}`}
                    allowClear
                    style={inputStyle}
                  />
                )}
                {item.type === 'select' && (
                  <Select
                    placeholder={item.placeholder || `请选择${item.label}`}
                    allowClear
                    options={item.options}
                    style={inputStyle}
                  />
                )}
                {item.type === 'date' && (
                  <DatePicker
                    placeholder={item.placeholder || `请选择${item.label}`}
                    style={{ '--search-input-width': `${item.width || 180}px` } as React.CSSProperties}
                  />
                )}
                {item.type === 'dateRange' && (
                  <DatePicker.RangePicker
                    style={{ '--search-input-width': `${item.width || 280}px` } as React.CSSProperties}
                  />
                )}
              </Form.Item>
            </Col>
          )
        })}
        <Col>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
            {extra}
          </Space>
        </Col>
      </Row>
    </Form>
  )
}