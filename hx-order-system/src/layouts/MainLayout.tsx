import { Layout, Menu, theme, Avatar, Dropdown, Space, Tag, Button, Tooltip } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ProfileOutlined,
  DatabaseOutlined,
  TruckOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import styles from './MainLayout.module.css'

const { Sider, Content, Header } = Layout

/**
 * 移动端 H5 入口地址
 * - 默认本地开发端口 5174（与 memory [代码部署习惯] 一致：`npx serve -l5174`）
 * - 真实部署时通过环境变量 VITE_H5_URL 覆盖
 */
const H5_ENTRY_URL =
  (import.meta.env.VITE_H5_URL as string | undefined) || 'http://localhost:5174/preview.html'

/**
 * 主布局 - 订单逻辑主线 + 基础档案 + 物流管理 + 系统管理
 *
 * 主线围绕"订单状态"推进：默认进入订单工作台（4 列看板），
 * 把原 6 泳道部门菜单折叠为 3 块（订单 / 档案 / 部门视图对照），让四个部门在同一张订单上协作。
 */
export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuthStore()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/orders',
      icon: <ProfileOutlined />,
      label: '订单中心',
      children: [
        { key: '/orders/board', label: '订单工作台' },
        { key: '/orders', label: '全部订单' },
      ],
    },
    {
      key: '/archives',
      icon: <DatabaseOutlined />,
      label: '基础档案',
      children: [
        { key: '/logistics/vehicles', label: '车辆档案' },
        { key: '/logistics/drivers', label: '司机档案' },
        { key: '/marketing/companies', label: '物流公司' },
        { key: '/marketing/customers', label: '客户档案' },
        { key: '/marketing/inventory', label: '库存管理' },
      ],
    },
    {
      key: '/dept',
      icon: <TruckOutlined />,
      label: '物流管理',
      children: [
        { key: '/marketing/dispatch', label: '调车单管理' },
        { key: '/logistics/dispatch', label: '派车调度' },
        { key: '/warehouse', label: '库房排队' },
        { key: '/logistics/efficiency', label: '调度时效' },
        { key: '/logistics/locations', label: '车辆位置' },
      ],
    },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/users', label: '用户管理' },
        { key: '/system/roles', label: '角色管理' },
        { key: '/system/dingtalk', label: '钉钉配置' },
      ],
    },
  ]

  const userMenu = {
    items: [
      { key: 'profile', label: `${currentUser?.realName || '用户'} (${currentUser?.roleName || '-'})`, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout()
        navigate('/login')
      }
    },
  }

  return (
    <Layout className={styles.layout}>
      <Sider width={220} theme="dark">
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📦</span>
          华翔订单
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['/orders', '/archives', '/dept']}
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          className={styles.header}
          style={{ background: colorBgContainer }}
        >
          <Space>
            <span className={styles.headerTitle}>华翔订单管理系统</span>
            <Tag color="blue">V0.3.0</Tag>
            <Tag color="cyan">订单逻辑 · M3</Tag>
            <Tag color="geekblue">GPS 自动打卡</Tag>
          </Space>
          <Space size="large">
            <Tooltip title={`司机端 H5（${H5_ENTRY_URL}）`}>
              <Button
                type="link"
                size="small"
                icon={<MobileOutlined />}
                href={H5_ENTRY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                司机端 H5
              </Button>
            </Tooltip>
            <BellOutlined className={styles.bellIcon} />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space className={styles.userTrigger}>
                <Avatar size="small" icon={<UserOutlined />} className={styles.userAvatar} />
                <span>{currentUser?.realName || '未登录'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
