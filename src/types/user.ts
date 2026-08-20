/**
 * 用户相关类型（对应后端 User / LoginResult / PageResult 实体）
 */

export interface Role {
  id: number
  roleCode: string
  roleName: string
  description?: string
  dataScope?: string
  status?: number
  createTime?: string
  updateTime?: string
}

export interface User {
  id: number
  username: string
  password?: string
  nickname?: string
  departmentId?: number
  status?: number
  createtime?: string
  updatetime?: string
  roles?: Role[]
  permCodes?: string[]
}

export interface LoginResult {
  token: string
  refreshToken?: string
  user?: User
}

export interface PageResult<T> {
  total: number
  list: T[]
  page: number
  pageSize: number
}
