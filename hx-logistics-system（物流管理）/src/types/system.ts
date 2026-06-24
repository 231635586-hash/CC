import type { EnableStatus, Timestamp } from './index'

/** 用户 */
export interface User {
  id: string
  username: string
  realName: string
  phone: string
  email?: string
  roleId: string
  roleName: string
  companyId?: string // 关联物流公司（外部账号时填写）
  companyName?: string
  status: EnableStatus
  createdAt: Timestamp
  lastLoginAt?: Timestamp
}

/** 角色 */
export interface Role {
  id: string
  name: string
  code: string
  permissions: string[] // 权限点列表
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
}

/** 园区 */
export interface Yard {
  id: string
  name: string // 园区名称（如：秦壁、甘亭）
  code: string // 园区编码
  address?: string
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
}

/** 钉钉群机器人配置 */
export interface DingtalkBot {
  id: string
  name: string
  webhookUrl: string
  secret?: string
  groupType: 'dispatch_group' | 'logistics' | 'factory' | 'management' // 调度群/物流群/工厂群/管理群
  yardId?: string // 关联园区（工厂群时填写）
  yardName?: string
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
}

/** 钉钉消息模板 */
export interface DingtalkTemplate {
  id: string
  code: string
  name: string
  content: string // 模板内容（含变量占位符）
  variables: string[] // 变量列表
  status: EnableStatus
  createdAt: Timestamp
}
