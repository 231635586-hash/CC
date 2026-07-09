import { Empty as AntEmpty } from 'antd'

interface EmptyProps {
  description?: string
}

export function Empty({ description = '暂无数据' }: EmptyProps) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <AntEmpty description={description} />
    </div>
  )
}
