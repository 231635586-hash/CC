/**
 * 表单分组区块 + 必填说明
 * 统一所有 Drawer / Modal 表单的"分组标题"与"标注 * 为必填"提示样式
 */
import type { ReactNode } from 'react'
import styles from './FormSection.module.css'

interface FormSectionProps {
  title: string
  children: ReactNode
}

/** 表单分组：左侧蓝色色块 + 标题 */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className={styles.group}>
      <div className={styles.title}>{title}</div>
      {children}
    </div>
  )
}

/** 必填字段说明：固定在表单顶部 */
export function RequiredHint() {
  return (
    <div style={{ marginBottom: 12, color: '#999', fontSize: 12 }}>
      标注 <span style={{ color: '#ff4d4f' }}>*</span> 为必填字段
    </div>
  )
}
