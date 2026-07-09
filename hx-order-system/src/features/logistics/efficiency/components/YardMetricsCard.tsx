import { Card, Descriptions, Tag, Space, Statistic, Row, Col } from 'antd'
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { YardEfficiency } from '@/types/dispatch'
import {
  OVERTIME_REASON_LABEL,
  OVERTIME_DEPARTMENT_LABEL,
} from '@/types/dispatch'
import { formatMinutesAsHour } from '@/utils/efficiencyAnalysis'

interface Props {
  metric: YardEfficiency
  index: number
}

/**
 * 单园区调度时效指标卡
 *
 * 展示 7 个核心指标：
 *  - 排队与要求差异（规则 1）
 *  - 装车耗时（规则 2，含禁行时段）
 *  - 扣减禁行时长（规则 2 附属）
 *  - 装货用时（规则 3）
 *  - 标准用时 / 是否超时（规则 4）
 *  - 超时原因 + 责任部门（规则 5/6，仅超时展示）
 *  - 出厂时间（规则 7）
 */
export function YardMetricsCard({ metric: m, index }: Props) {
  const isEarly = m.queueDiffMin < 0
  const isLate = m.queueDiffMin > 0

  return (
    <Card
      size="small"
      title={
        <Space>
          <Tag color="cyan">{index + 1}. {m.yardName || m.yardId}</Tag>
          {m.isFirstYard && <Tag color="purple">优先入场</Tag>}
          {m.isOvertime && <Tag color="red" icon={<WarningOutlined />}>超时 {formatMinutesAsHour(m.overtimeMin)}</Tag>}
          {!m.isOvertime && <Tag color="green" icon={<CheckCircleOutlined />}>未超时</Tag>}
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      {/* 4 个核心统计 */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Statistic
            title="排队与要求差异"
            value={formatMinutesAsHour(Math.abs(m.queueDiffMin))}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: isEarly ? '#52c41a' : isLate ? '#cf1322' : '#666' }}
            suffix={
              <span style={{ fontSize: 12, color: '#999' }}>
                {isEarly ? '提前' : isLate ? '迟到' : '准时'}
              </span>
            }
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="装车耗时（含禁行）"
            value={formatMinutesAsHour(m.enterToLoadRawMin)}
            prefix={<ThunderboltOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="扣减禁行时长"
            value={formatMinutesAsHour(m.restrictedMin)}
            valueStyle={{ color: '#999', fontSize: 14 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="装货用时（有效工作）"
            value={formatMinutesAsHour(m.effectiveLoadMin)}
            valueStyle={{
              color: m.isOvertime ? '#cf1322' : '#52c41a',
              fontWeight: 600,
            }}
          />
        </Col>
      </Row>

      {/* 详细字段 */}
      <Descriptions column={3} size="small" bordered>
        <Descriptions.Item label="标准用时">{formatMinutesAsHour(m.standardMin)}</Descriptions.Item>
        <Descriptions.Item label="超时分钟">
          <span style={{ color: m.isOvertime ? '#cf1322' : '#52c41a', fontWeight: 600 }}>
            {m.isOvertime ? `+${formatMinutesAsHour(m.overtimeMin)}` : '无超时'}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="出厂时间">{m.factoryOutTime || '-'}</Descriptions.Item>

        {m.isOvertime && (
          <>
            <Descriptions.Item label="超时原因" span={3}>
              <Space wrap>
                {m.overtimeReasons.map((r) => (
                  <Tag key={r} color="orange">{OVERTIME_REASON_LABEL[r] || r}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="责任部门" span={3}>
              <Tag color="red">
                {m.overtimeDepartment
                  ? OVERTIME_DEPARTMENT_LABEL[m.overtimeDepartment] || m.overtimeDepartment
                  : '待判定'}
              </Tag>
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Card>
  )
}