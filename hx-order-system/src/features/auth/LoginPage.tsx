import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography, Tag } from 'antd'
import { UserOutlined, LockOutlined, TruckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import styles from './LoginPage.module.css'

const { Title, Text } = Typography

/**
 * 登录页 - Mock 鉴权
 * 提示：
 *   admin / admin           -> 系统管理员
 *   marketing01 / 任意      -> 营销业务员
 *   logistics01 / 任意      -> 物流调度员
 *   company001 / 任意       -> 物流公司账号
 */
export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const user = await login(values.username, values.password)
      message.success(`欢迎回来，${user.realName}`)
      navigate('/')
    } catch (err) {
      message.error((err as Error).message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (username: string) => {
    form.setFieldsValue({ username, password: '123456' })
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🚚</div>
          <Title level={3} className={styles.systemTitle}>
            华翔物流管理系统
          </Title>
          <Text type="secondary">V0.1.0 (M1 阶段)</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入账号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<TruckOutlined />}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.demoBox}>
          <div className={styles.demoLabel}>💡 演示账号（点击快速填充）</div>
          <div className={styles.demoTags}>
            <Tag color="blue" className={styles.demoTag} onClick={() => quickFill('admin')}>
              admin/admin
            </Tag>
            <Tag color="cyan" className={styles.demoTag} onClick={() => quickFill('marketing01')}>
              marketing01
            </Tag>
            <Tag color="purple" className={styles.demoTag} onClick={() => quickFill('logistics01')}>
              logistics01
            </Tag>
            <Tag color="orange" className={styles.demoTag} onClick={() => quickFill('company001')}>
              company001
            </Tag>
          </div>
        </div>
      </Card>
    </div>
  )
}