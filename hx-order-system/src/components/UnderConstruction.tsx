import { Empty, Card, Button, Space, Tag } from 'antd'
import { ClockCircleOutlined, RocketOutlined } from '@ant-design/icons'
import styles from './UnderConstruction.module.css'

interface UnderConstructionProps {
  moduleName: string
  version: 'M2' | 'M3'
  features?: string[]
}

/** M2/M3 占位页 */
export function UnderConstruction({ moduleName, version, features = [] }: UnderConstructionProps) {
  return (
    <Card bordered={false} className={styles.card}>
      <div className={styles.center}>
        <Empty
          image={<RocketOutlined className={styles.icon} />}
          description={
            <div>
              <h2 className={styles.title}>{moduleName}</h2>
              <Space size="small" className={styles.tagSpace}>
                <Tag icon={<ClockCircleOutlined />} color="processing">
                  规划中
                </Tag>
                <Tag color="blue">{version} 阶段</Tag>
              </Space>
              {features.length > 0 && (
                <div className={styles.features}>
                  <div className={styles.featuresLabel}>规划功能：</div>
                  <ul className={styles.featuresList}>
                    {features.map((f) => (
                      <li key={f} className={styles.featuresItem}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          }
        >
          <Button type="primary" disabled>
            敬请期待
          </Button>
        </Empty>
      </div>
    </Card>
  )
}