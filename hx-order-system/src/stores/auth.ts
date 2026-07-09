import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockDB } from '@/mock/db'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  currentUser: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

/**
 * 鉴权 Store（持久化到 localStorage，key=hx-auth）
 * 注：M1 阶段使用 Mock 鉴权，后续对接真实接口
 * token 持久化由 zustand/persist 统一管理；services/http.ts 直接读
 * `useAuthStore.getState().token`，不再额外写 hx_token 键。
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      isAuthenticated: false,
      login: async (username, password) => {
        // Mock 鉴权：用户名=admin/任意密码 直接登录管理员
        const users = await mockDB.listUsers()
        let user: User | undefined
        if (username === 'admin' && password === 'admin') {
          user = users.find((u) => u.username === 'admin')
        } else {
          // 其他用户名：取第一个匹配
          user = users.find((u) => u.username === username)
        }
        if (!user) {
          throw new Error('用户名或密码错误')
        }
        const token = `mock-token-${user.id}-${Date.now()}`
        set({ token, currentUser: user, isAuthenticated: true })
        return user
      },
      logout: () => {
        set({ token: null, currentUser: null, isAuthenticated: false })
      },
    }),
    { name: 'hx-auth' },
  ),
)
