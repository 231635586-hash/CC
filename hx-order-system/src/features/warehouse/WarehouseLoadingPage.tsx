import { useEffect, useMemo } from 'react'
import { Table, Tag, Space, Card, Empty, Button } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageContainer, SCROLL_PRESETS, StatusTag } from '@/components'
import { useDispatchStore, useDictStore } from '@/stores'
import type { Dispatch } from '@/types/dispatch'
import { formatDuration, getActiveYardIndex } from '@/utils/dispatchTimeline'

/** 装货进度 4 档（不入 DispatchStatus，本页独立字典） */
type LoadingProgress = 'done' | 'pending-leave' | 'loading' | 'idle'
const LOADING_PROGRESS_MAP: Record<LoadingProgress, { label: string; color: string }> = {
  done:          { label: '已完成',  color: 'success' },
  'pending-leave':{ label: '待离场', color: 'processing' },
  loading:       { label: '装货中',  color: 'warning' },
  idle:          { label: '未入场',  color: 'default' },
}

/**
 * 库房装货管理（M2 阶段 6）
 * - 显示正在装货或装货完成等待离场的调车单
 * - 与 WarehouseQueuePage 区别：本页专注于装货阶段详情
 * - M2 mock：实际"装货完成"动作在 QueuePage 完成；本页提供列表视图 + 跳转详情
 */
export function WarehouseLoadingPage() {
  const navigate = useNavigate()
  const { list, load } = useDispatchStore()
  const { yards, loadYards } = useDictStore()

  useEffect(() => {
    load()
    loadYards()
  }, [load, loadYards])

  const data = useMemo(() => {
    return list.filter((d) =>
      ['dispatched', 'entering', 'loading', 'leaving'].includes(d.status),
    )
  }, [list])

  return (
    <PageContainer
      title="装货管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          手动刷新
        </Button>
      }
    >
      <Card>
        <Table<Dispatch>
          rowKey="id"
          dataSource={data}
          locale={{ emptyText: <Empty description="暂无装货中的调车单" /> }}
          columns={[
            { title: '调车编号', dataIndex: 'dispatchNo', width: 150 },
            {
              title: '当前园区',
              width: 120,
              render: (_, r) => {
                const idx = getActiveYardIndex(r)
                const y = r.yardTimelines?.[idx]
                return y ? <Tag color="cyan">{y.yardName || y.yardId}</Tag> : <span style={{ color: '#999' }}>-</span>
              },
            },
            { title: '车牌', dataIndex: 'vehicleNo', width: 100 },
            { title: '司机', dataIndex: 'driverName', width: 100 },
            { title: '公司', dataIndex: 'companyName', width: 200, ellipsis: true },
            {
              title: '入库时间',
              width: 160,
              render: (_, r) => {
                const idx = getActiveYardIndex(r)
                const y = r.yardTimelines?.[idx]
                return y?.enteredAt || '-'
              },
            },
            {
              title: '装货进度',
              width: 100,
              render: (_, r) => {
                const idx = getActiveYardIndex(r)
                const y = r.yardTimelines?.[idx]
                if (!y) return '-'
                if (y.leftAt) return <StatusTag value="done" map={LOADING_PROGRESS_MAP} />
                if (y.loadingCompletedAt) return <StatusTag value="pending-leave" map={LOADING_PROGRESS_MAP} />
                if (y.enteredAt) return <StatusTag value="loading" map={LOADING_PROGRESS_MAP} />
                return <StatusTag value="idle" map={LOADING_PROGRESS_MAP} />
              },
            },
            {
              title: '停留时长',
              width: 110,
              render: (_, r) => {
                const idx = getActiveYardIndex(r)
                const y = r.yardTimelines?.[idx]
                if (!y?.enteredAt) return '-'
                const ms = Date.now() - new Date(y.enteredAt).getTime()
                return <span style={{ color: ms > 7200000 ? '#cf1322' : '#1677ff' }}>{formatDuration(ms)}</span>
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 100,
              render: (_, r) => (
                <Space size="small">
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/warehouse/dispatch/${r.id}`)}
                  >
                    详情
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: SCROLL_PRESETS.medium }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </PageContainer>
  )
}