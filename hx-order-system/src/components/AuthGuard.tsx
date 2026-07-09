import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

/** 鉴权守卫 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
