import { Table, Tag, Tooltip } from 'antd'
import type { DispatchGoods } from '@/types/dispatch'

interface Props {
  goods: DispatchGoods[]
}

/**
 * 共享货物清单 Table（M2 数据联动优化）
 *
 * 单一数据源：调车单详情页 + 库房详情页共用同一份列定义。
 * 字段：货物名称 / 数量 / 单位 / 重量 / 客户 / 库存业务员 / 目的地 / 备注。
 */
export function GoodsTable({ goods }: Props) {
  return (
    <Table
      size="small"
      rowKey="id"
      dataSource={goods}
      pagination={false}
      columns={[
        { title: '货物名称', dataIndex: 'goodsName' },
        { title: '数量', dataIndex: 'quantity', width: 80 },
        { title: '单位', dataIndex: 'unit', width: 60 },
        { title: '重量(kg)', dataIndex: 'weight', width: 100 },
        { title: '客户', dataIndex: 'customerName' },
        {
          title: '库存业务员',
          dataIndex: 'salesPersonName',
          width: 110,
          render: (v: string | undefined, g: { inventoryId?: string }) => {
            if (!v) return <span style={{ color: '#ccc' }}>-</span>
            const fromInventory = !!g.inventoryId
            return (
              <Tooltip title={fromInventory ? `来自库存 ${g.inventoryId}` : '手工录入（取当前用户）'}>
                <Tag color={fromInventory ? 'blue' : 'default'}>{v}</Tag>
              </Tooltip>
            )
          },
        },
        { title: '目的地', dataIndex: 'destination' },
        { title: '备注', dataIndex: 'remark' },
      ]}
    />
  )
}