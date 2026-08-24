/**
 * 权限 / 角色相关类型（对应后端 Permission / OperationLog 实体）
 */

export type PermType = 'catalog' | 'menu' | 'button' | 'data'

export interface Permission {
  id: number
  permCode: string
  permName: string
  permType: PermType
  parentId?: number
  dataScope?: string
  path?: string
  component?: string
  icon?: string
  sortOrder?: number
  status?: number
  createTime?: string
  updateTime?: string
  children?: Permission[]
}

export interface OperationLog {
  id: number
  userId?: number
  username?: string
  operation?: string
  method?: string
  params?: string
  ip?: string
  status?: number
  errorMsg?: string
  createTime?: string
}
