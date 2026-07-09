/**
 * 404 页面：URL 不匹配任何路由时展示
 * - 显示当前错误路径
 * - 提供"返回首页"按钮
 */
import { Button, Result } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title="404"
      subTitle={
        <>
          抱歉，您访问的页面不存在。
          <br />
          <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
            {location.pathname}
          </code>
        </>
      }
      extra={
        <Button type="primary" onClick={() => navigate('/', { replace: true })}>
          返回首页
        </Button>
      }
    />
  )
}
