import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, Tooltip, Empty } from 'antd'
import { EnvironmentOutlined, ReloadOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons'
import { PageContainer, SCROLL_PRESETS } from '@/components'
import { useDictStore, useDispatchStore } from '@/stores'
import type { VehicleLocation } from '@/types'

/** 车辆位置列表（P1：仅显示定位点，不接地图） */
export function LocationListPage() {
  const {
    vehicleLocations,
    loadVehicleLocations,
    vehicles,
    drivers,
    loadVehicles,
    loadDrivers,
  } = useDictStore()
  const { list: dispatches, load: loadDispatches } = useDispatchStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    loadVehicleLocations()
    loadVehicles()
    loadDrivers()
    loadDispatches()
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [loadVehicleLocations, loadVehicles, loadDrivers, loadDispatches])

  // 计算位置新鲜度
  const getFreshness = (updatedAt: string) => {
    const diff = (now.getTime() - new Date(updatedAt).getTime()) / 1000
    if (diff < 60) return { label: '实时', color: 'green' }
    if (diff < 300) return { label: '5分钟内', color: 'blue' }
    if (diff < 1800) return { label: '30分钟内', color: 'orange' }
    return { label: '过期', color: 'red' }
  }

  const online = vehicleLocations.filter((l) => (now.getTime() - new Date(l.updatedAt).getTime()) / 1000 < 1800)

  /**
   * 计算每辆车的"目的地"：
   * 关联该 vehicleId 的未完成调车单（status 非 completed/cancelled），
   * 聚合所有 goods.destination 去重展示。
   * 没有任务时返回 '-（空闲车辆）'。
   */
  const destinationsByVehicle = useMemo(() => {
    const map = new Map<string, string[]>()
    dispatches.forEach((d) => {
      if (d.status === 'completed' || d.status === 'cancelled') return
      if (!d.vehicleId) return
      const list = map.get(d.vehicleId) || []
      d.goods?.forEach((g) => {
        if (g.destination && !list.includes(g.destination)) list.push(g.destination)
      })
      map.set(d.vehicleId, list)
    })
    return map
  }, [dispatches])

  return (
    <PageContainer
      title="车辆位置"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => loadVehicleLocations()}>
          刷新
        </Button>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线车辆"
              value={online.length}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总车辆" value={vehicles.length} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运输中"
              value={online.filter((l) => l.speed > 0).length}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="停车中"
              value={online.filter((l) => l.speed === 0).length}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="定位点列表（M1 简化版：仅显示点，不接地图）" size="small">
        <Table<VehicleLocation>
          rowKey="id"
          dataSource={vehicleLocations}
          locale={{ emptyText: <Empty description="暂无定位数据" /> }}
          pagination={false}
          columns={[
            { title: '车牌号', dataIndex: 'plateNo', width: 120 },
            {
              title: '物流公司',
              dataIndex: 'vehicleId',
              width: 200,
              ellipsis: true,
              render: (vehicleId: string) => {
                const v = vehicles.find((x) => x.id === vehicleId)
                return v?.companyName || '-'
              },
            },
            {
              title: '司机',
              dataIndex: 'vehicleId',
              width: 100,
              render: (vehicleId: string) => {
                const v = vehicles.find((x) => x.id === vehicleId)
                const dr = v?.defaultDriverId ? drivers.find((d) => d.id === v.defaultDriverId) : null
                return dr?.name || '-'
              },
            },
            {
              title: '联系方式',
              dataIndex: 'vehicleId',
              width: 140,
              render: (vehicleId: string) => {
                const v = vehicles.find((x) => x.id === vehicleId)
                const dr = v?.defaultDriverId ? drivers.find((d) => d.id === v.defaultDriverId) : null
                return dr?.phone || '-'
              },
            },
            {
              title: '目的地',
              dataIndex: 'vehicleId',
              width: 200,
              render: (vehicleId: string) => {
                const dests = destinationsByVehicle.get(vehicleId) || []
                if (dests.length === 0) return <span style={{ color: '#999' }}>-（空闲车辆）</span>
                return dests.map((d, i) => (
                  <Tag key={i} color="geekblue">{d}</Tag>
                ))
              },
            },
            {
              title: '经度',
              dataIndex: 'longitude',
              width: 110,
              render: (v: number) => v.toFixed(6),
            },
            {
              title: '纬度',
              dataIndex: 'latitude',
              width: 110,
              render: (v: number) => v.toFixed(6),
            },
            { title: '地址', dataIndex: 'address' },
            {
              title: '速度',
              dataIndex: 'speed',
              width: 100,
              render: (v: number) => (
                <Space>
                  <Tag color={v > 0 ? 'processing' : 'default'}>{v} km/h</Tag>
                </Space>
              ),
            },
            {
              title: '方向',
              dataIndex: 'direction',
              width: 80,
              render: (v: number) => v ? `${v}°` : '-',
            },
            {
              title: '新鲜度',
              dataIndex: 'updatedAt',
              width: 110,
              render: (v: string) => {
                const f = getFreshness(v)
                return <Tag color={f.color}>{f.label}</Tag>
              },
            },
            {
              title: '更新时间',
              dataIndex: 'updatedAt',
              width: 160,
              render: (v: string) => (
                <Tooltip title={v}>
                  <ClockCircleOutlined /> {v.slice(11, 19)}
                </Tooltip>
              ),
            },
            {
              title: '操作',
              fixed: 'right',
              width: 100,
              render: (_, r) => (
                <Button
                  type="link"
                  size="small"
                  icon={<EnvironmentOutlined />}
                  onClick={() => {
                    window.open(`https://uri.amap.com/marker?position=${r.longitude},${r.latitude}&name=${r.plateNo}`)
                  }}
                >
                  查看位置
                </Button>
              ),
            },
          ]}
          scroll={{ x: SCROLL_PRESETS.wide }}
        />
      </Card>

      <Card title="M1 说明" size="small" style={{ marginTop: 16, background: '#fafafa' }}>
        <Space direction="vertical" size="small">
          <div>📍 M1 阶段仅显示定位点列表，不接入完整地图</div>
          <div>🔄 位置数据由后端定时上报，前端每分钟自动刷新新鲜度</div>
          <div>🗺️ 完整地图 + 轨迹回放：规划至 M3 阶段</div>
        </Space>
      </Card>
    </PageContainer>
  )
}
