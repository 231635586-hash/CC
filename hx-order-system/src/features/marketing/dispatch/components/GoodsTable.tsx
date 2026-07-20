import { Table, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import type { DispatchGoods } from '@/types/dispatch'
import { STOCK_TYPE_LABEL } from '@/types/inventory'

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
        {
          title: '现货/等货',
          dataIndex: 'stockType',
          width: 100,
          render: (v: string | undefined) => {
            if (!v) return <span style={{ color: '#ccc' }}>-</span>
            const isWaiting = v === 'waiting'
            return (
              <Tag color={isWaiting ? 'orange' : 'green'}>
                {STOCK_TYPE_LABEL[v as keyof typeof STOCK_TYPE_LABEL] ?? v}
              </Tag>
            )
          },
        },
        {
          title: '预计到货时间',
          dataIndex: 'expectedArrivalAt',
          width: 130,
          render: (v: string | undefined, g: { stockType?: string; inventoryId?: string }) => {
            // 仅等货物显示日期；现货或无值显示 -
            if (g.stockType !== 'waiting' || !v) return <span style={{ color: '#ccc' }}>-</span>
            return dayjs(v).format('YYYY-MM-DD')
          },
        },
        { title: '客户', dataIndex: 'customerName' },
        {
          title: '库存业务员',
          dataIndex: 'salesPersonName',
          width: 110,
          render: (v: string | undefined, g: { stockType?: string; inventoryId?: string }) => {
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