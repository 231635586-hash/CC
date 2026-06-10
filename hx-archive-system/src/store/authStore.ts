import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

// ========================================
// 权限/认证状态管理
// ========================================

// 权限矩阵定义
const permissionMatrix: Record<UserRole, string[]> = {
  system_admin: [
    'archive.view',
    'archive.export',
    'probation.view',
    'probation.view',
    'transfer.view',
    'resignation.view',
    'salary.view',
    'salary.view_detail',
    'salary.export',
    'permission.configure',
  ],
  hr_admin: [
    'archive.view',
    'archive.export',
    'probation.view',
    'probation.view',
    'transfer.view',
    'resignation.view',
    'salary.view',
    'salary.view_detail',
    'salary.export',
  ],
  department_head: [
    'archive.view_department',
    'archive.export_department',
    'probation.view_department',
    'transfer.view_department',
    'resignation.view_department',
    'salary.view_department',
  ],
  employee: [
    'archive.view_self',
    'probation.view_self',
    'transfer.view_self',
    'salary.view_self',
  ],
  finance: [
    'salary.view',
    'salary.view_detail',
    'salary.export',
  ],
};

interface AuthStore {
  // 当前用户
  currentUser: User | null;

  // 角色权限映射（管理员配置）
  rolePermissions: Record<UserRole, string[]>;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setRolePermissions: (permissions: Record<UserRole, string[]>) => void;

  // 权限检查
  hasPermission: (action: string) => boolean;
  hasAnyPermission: (actions: string[]) => boolean;
  hasAllPermissions: (actions: string[]) => boolean;

  // 角色检查
  isRole: (role: UserRole) => boolean;
  isAnyRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      rolePermissions: permissionMatrix,

      setCurrentUser: (user) => set({ currentUser: user }),
      setRolePermissions: (permissions) => set({ rolePermissions: permissions }),

      hasPermission: (action) => {
        const { currentUser, rolePermissions } = get();
        if (!currentUser) return false;

        const permissions = rolePermissions[currentUser.role] || [];
        return permissions.includes(action);
      },

      hasAnyPermission: (actions) => {
        return actions.some((action) => get().hasPermission(action));
      },

      hasAllPermissions: (actions) => {
        return actions.every((action) => get().hasPermission(action));
      },

      isRole: (role) => {
        const { currentUser } = get();
        return currentUser?.role === role;
      },

      isAnyRole: (roles) => {
        const { currentUser } = get();
        return currentUser ? roles.includes(currentUser.role) : false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        rolePermissions: state.rolePermissions,
      }),
    }
  )
);