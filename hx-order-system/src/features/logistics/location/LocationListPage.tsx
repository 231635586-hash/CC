import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Row, Col, Statistic, Button, Tooltip, Empty, Popconfirm, message } from 'antd'
import {
  EnvironmentOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CarOutlined,
  AimOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { PageContainer, SCROLL_PRESETS } from '@/components'
import { useDictStore, useDispatchStore } from '@/stores'
import { subscribeGps, teleportVehicle, getCurrentPings, type GpsPing } from '@/mock/gpsStream'
import { useNavigate } from 'react-router-dom'

/**
 * 车辆位置列表（M3 阶段：GPS 流 + 入园判定）
 *
 * 数据源：mock 阶段直接订阅 gpsStream；真实阶段由后端推送。
 * 加列：
 *  - 所在园区（基于 inYard）
 *  - 距离最近园区（米）
 * 操作列加"瞬移"演示按钮（驶向园区 / 驶离园区），便于 demo 触发 GPS 入/离厂事件。
 */
export function LocationListPage() {
  const { vehicles, drivers, loadVehicles, loadDrivers } = useDictStore()
  const { list: dispatches, load: loadDispatches } = useDispatchStore()
  const navigate = useNavigate()
  const [pings, setPings] = useState<GpsPing[]>([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    loadVehicles()
    loadDrivers()
    loadDispatches()
    // 初始化取一次（订阅会立刻推一次，但保险起见）
    setPings(getCurrentPings())
    // 订阅位置流
    const unsubscribe = subscribeGps((next) => setPings(next))
    const t = setInterval(() => setNow(new Date()), 5000)
    return () => {
      unsubscribe()
      clearInterval(t)
    }
  }, [loadVehicles, loadDrivers, loadDispatches])

  // 计算位置新鲜度
  const getFreshness = (updatedAt: string) => {
    const diff = (now.getTime() - new Date(updatedAt).getTime()) / 1000
    if (diff < 60) return { label: '实时', color: 'green' }
    if (diff < 300) return { label: '5分钟内', color: 'blue' }
    if (diff < 1800) return { label: '30分钟内', color: 'orange' }
    return { label: '过期', color: 'red' }
  }

  // 关联的调车单（status 非 completed/cancelled）目的地
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

  const online = pings.filter((p) => (now.getTime() - new Date(p.updatedAt).getTime()) / 1000 < 1800)
  const inYardCount = pings.filter((p) => p.inYard).length

  /** 演示：把指定车辆瞬移到园区门口（触发 GPS 入园 → dispatch.entering） */
  const handleTeleport = (vehicleId: string, mode: 'enter' | 'leave' | 'enroute' | 'far') => {
    teleportVehicle(vehicleId, mode)
    const labels = { enter: '驶向园区', leave: '驶离园区', enroute: '运输中', far: '已收车' }
    message.success(`已模拟：${labels[mode]}`)
  }

  return (
    <PageContainer
      title="车辆位置"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setPings(getCurrentPings())}>
            刷新
          </Button>
        </Space>
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
              value={online.filter((p) => p.speed > 0).length}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已入园"
              value={inYardCount}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="定位点列表（M3 阶段：GPS 位置流 + 园区入园判定）" size="small">
        <Table<GpsPing>
          rowKey="vehicleId"
          dataSource={pings}
          locale={{ emptyText: <Empty description="暂无定位数据" /> }}
          pagination={false}
          columns={[
            { title: '车牌号', dataIndex: 'plateNo', width: 110 },
            {
              title: '所在园区',
              dataIndex: 'inYard',
              width: 130,
              render: (inYard: GpsPing['inYard']) => {
                if (!inYard) return <span style={{ color: '#999' }}>-</span>
                return <Tag color="geekblue">{inYard.yardName}</Tag>
              },
            },
            {
              title: '距最近园区',
              dataIndex: 'distanceToYardM',
              width: 110,
              render: (d?: number) => {
                if (d == null) return '-'
                if (d < 1000) return `${Math.round(d)} m`
                return `${(d / 1000).toFixed(1)} km`
              },
            },
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
                return dests.map((d, i) => <Tag key={i} color="geekblue">{d}</Tag>)
              },
            },
            {
              title: '经度',
              dataIndex: 'lng',
              width: 110,
              render: (v: number) => v.toFixed(6),
            },
            {
              title: '纬度',
              dataIndex: 'lat',
              width: 110,
              render: (v: number) => v.toFixed(6),
            },
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
              render: (v: number) => (v ? `${v}°` : '-'),
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
              width: 240,
              render: (_, r) => (
                <Space size={4} direction="vertical" style={{ width: '100%' }}>
                  <Space size={4}>
                    <Button
                      size="small"
                      type="link"
                      icon={<EnvironmentOutlined />}
                      onClick={() => {
                        window.open(
                          `https://uri.amap.com/marker?position=${r.lng},${r.lat}&name=${r.plateNo}`,
                        )
                      }}
                    >
                      位置
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => navigate(`/orders`)}
                    >
                      订单
                    </Button>
                  </Space>
                  <Space size={4}>
                    <Popconfirm
                      title="驶向园区（模拟 GPS 入园）"
                      onConfirm={() => handleTeleport(r.vehicleId, 'enter')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button size="small" type="link" icon={<AimOutlined />}>
                        驶向园区
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="驶离园区（模拟 GPS 离厂）"
                      onConfirm={() => handleTeleport(r.vehicleId, 'leave')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button size="small" type="link" icon={<SendOutlined />}>
                        驶离园区
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              ),
            },
          ]}
          scroll={{ x: SCROLL_PRESETS.wide }}
        />
      </Card>

      <Card title="M3 阶段说明（GPS 自动打卡）" size="small" style={{ marginTop: 16, background: '#fafafa' }}>
        <Space direction="vertical" size="small">
          <div>📡 位置数据由 mock 阶段 <code>src/mock/gpsStream.ts</code> 模拟；真实生产对接 JT/T 808 部标机 GPS 平台</div>
          <div>🚛 「驶向园区」按钮：把车辆瞬移到秦壁园区门口 → 5s 内 tick 判定入园 → 调车单 status → entering</div>
          <div>🏁 「驶离园区」按钮：把车辆移到园区外 1km → 5s 内 tick 判定离厂 → 调车单 status → completed</div>
          <div>🛰️ 园区入园判定：经纬度距园区中心 ≤ enterRadiusM（默认 300m）即认为入园</div>
        </Space>
      </Card>
    </PageContainer>
  )
}
