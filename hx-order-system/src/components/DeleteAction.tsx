/**
 * 列表行【删除】按钮
 * 统一所有 ListPage 删除操作的 Popconfirm + danger Button 模板
 */
import { Popconfirm, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

interface Props {
  /** 是否禁用（如：已停用客户不能重复删除） */
  disabled?: boolean
  /** 提示标题（默认：确认删除？） */
  title?: React.ReactNode
  /** 提示描述 */
  description?: React.ReactNode
  /** 确认回调 */
  onConfirm: () => void
  /** 按钮文字（默认：删除） */
  text?: string
}

/**
 * 删除操作：红色 danger 按钮 + Popconfirm 二次确认
 *
 * @example
 *   <DeleteAction onConfirm={() => handleDelete(record.id)} />
 *   <DeleteAction disabled={!canDelete} title={`确认删除客户「${name}」？`} onConfirm={...} />
 */
export function DeleteAction({
  disabled,
  title = '确认删除？',
  description,
  onConfirm,
  text = '删除',
}: Props) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      disabled={disabled}
      onConfirm={onConfirm}
    >
      <Button
        type="link"
        size="small"
        danger
        icon={<DeleteOutlined />}
        disabled={disabled}
      >
        {text}
      </Button>
    </Popconfirm>
  )
}
