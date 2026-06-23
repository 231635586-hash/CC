import { Layout, Menu, theme, Avatar, Dropdown, Space, Tag } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShopOutlined,
  TruckOutlined,
  SafetyOutlined,
  CalculatorOutlined,
  HomeOutlined,
  FileProtectOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import styles from './MainLayout.module.css'

const { Sider, Content, Header } = Layout

/**
 * 主布局 - 6大泳道菜单 + 系统管理
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
      key: '/marketing',
      icon: <ShopOutlined />,
      label: '营销管理',
      children: [
        { key: '/marketing/dispatch', label: '调车单管理' },
        { key: '/marketing/inventory', label: '库存管理' },
        { key: '/marketing/customers', label: '客户档案' },
        { key: '/marketing/companies', label: '物流公司' },
        { key: '/marketing/warehouse', label: '成品库管理', disabled: true },
      ],
    },
    {
      key: '/logistics',
      icon: <TruckOutlined />,
      label: '物流管理',
      children: [
        { key: '/logistics/dispatch', label: '派车调度' },
        { key: '/logistics/vehicles', label: '车辆档案' },
        { key: '/logistics/drivers', label: '司机档案' },
        { key: '/logistics/dispatchers', label: '调车员' },
        { key: '/logistics/yards', label: '园区档案' },
        { key: '/logistics/locations', label: '车辆位置' },
      ],
    },
    {
      key: '/security',
      icon: <SafetyOutlined />,
      label: '门禁管理',
      children: [
        { key: '/security/config', label: '门禁配置' },
        { key: '/security/records', label: '门禁记录', disabled: true },
      ],
    },
    {
      key: '/weighing',
      icon: <CalculatorOutlined />,
      label: '磅房管理',
      disabled: true,
      children: [{ key: '/weighing/main', label: 'M2 上线' }],
    },
    {
      key: '/quality',
      icon: <FileProtectOutlined />,
      label: '品质管理',
      disabled: true,
      children: [{ key: '/quality/main', label: 'M3 上线' }],
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
          <span className={styles.logoIcon}>🚚</span>
          华翔物流
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['/marketing', '/logistics', '/system']}
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
            <span className={styles.headerTitle}>华翔物流管理系统</span>
            <Tag color="blue">V0.1.0</Tag>
            <Tag color="cyan">M1 阶段</Tag>
          </Space>
          <Space size="large">
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