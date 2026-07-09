import { ReactNode } from 'react'
import { Card } from 'antd'
import styles from './PageContainer.module.css'

interface PageContainerProps {
  title?: string
  extra?: ReactNode
  children: ReactNode
  className?: string
}

/** 页面容器：标题+操作区+内容 */
export function PageContainer({ title, extra, children, className }: PageContainerProps) {
  return (
    <div className={className}>
      <Card
        bordered={false}
        title={title ? <span className="text-base font-medium">{title}</span> : undefined}
        extra={extra}
        className={styles.card}
        styles={{ body: { padding: 16 } }}
      >
        {children}
      </Card>
    </div>
  )
}