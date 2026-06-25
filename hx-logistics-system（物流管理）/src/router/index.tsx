import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { AuthGuard, UnderConstruction } from '@/components'

// 营销模块（使用 barrel 入口）
import { DispatchListPage, DispatchDetailPage } from '@/features/marketing/dispatch'
import { InventoryListPage } from '@/features/marketing/inventory'
import { CustomerListPage } from '@/features/marketing/customer'

// 物流模块
import { DispatchSchedulePage } from '@/features/logistics/dispatch/DispatchSchedulePage'
import { CompanyListPage } from '@/features/logistics/company/CompanyListPage'
import { VehicleListPage } from '@/features/logistics/vehicle/VehicleListPage'
import { DriverListPage } from '@/features/logistics/driver/DriverListPage'
import { LocationListPage } from '@/features/logistics/location/LocationListPage'

// 系统管理
import { UserListPage } from '@/features/system/user/UserListPage'
import { RoleListPage } from '@/features/system/role/RoleListPage'
import { DingtalkConfigPage } from '@/features/system/dingtalk/DingtalkConfigPage'

/**
 * 路由配置 - M1 阶段
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/marketing/dispatch" replace />} />

        {/* 营销管理 */}
        <Route path="marketing">
          <Route path="dispatch" element={<DispatchListPage />} />
          <Route path="dispatch/:id" element={<DispatchDetailPage />} />
          <Route path="inventory" element={<InventoryListPage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="companies" element={<CompanyListPage />} />
          <Route path="warehouse/*" element={<UnderConstruction moduleName="成品库管理" version="M2" features={['成品入库', '人员管理', '出库审核']} />} />
        </Route>

        {/* 物流管理 */}
        <Route path="logistics">
          <Route path="dispatch" element={<DispatchSchedulePage />} />
          <Route path="vehicles" element={<VehicleListPage />} />
          <Route path="drivers" element={<DriverListPage />} />
          <Route path="locations" element={<LocationListPage />} />
        </Route>

        {/* 占位模块 */}
        <Route path="weighing/*" element={<UnderConstruction moduleName="磅房管理" version="M2" features={['过磅数据采集', '±500KG 预警', '过磅单生成']} />} />
        <Route path="quality/*" element={<UnderConstruction moduleName="品质管理" version="M3" features={['品质报告', '品质追溯']} />} />

        {/* 系统管理 */}
        <Route path="system">
          <Route path="users" element={<UserListPage />} />
          <Route path="roles" element={<RoleListPage />} />
          <Route path="dingtalk" element={<DingtalkConfigPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
