import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { LoginResult, PageResult, Role, User } from '@/types/user'

interface RegisterParams {
  username: string
  password: string
}

interface LoginParams {
  username: string
  password: string
}

interface UpdatePwdParams {
  oldPassword: string
  newPassword: string
  rePassword: string
}

export interface UserQuery {
  username?: string
  status?: number
  departmentId?: number
  page?: number
  pageSize?: number
}

export interface UserCreateParams {
  username: string
  password: string
  nickname?: string
  departmentId?: number
  status?: number
  roleIds?: number[]
}

export interface UserUpdateParams {
  nickname?: string
  departmentId?: number
  status?: number
}

export function register(data: RegisterParams): Promise<ApiResult<null>> {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

export function login(data: LoginParams): Promise<ApiResult<LoginResult>> {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function logout(): Promise<ApiResult<null>> {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

export function refreshToken(refreshToken: string): Promise<ApiResult<LoginResult>> {
  return request({
    url: '/user/refresh',
    method: 'post',
    data: { refreshToken }
  })
}

export function getUserInfo(): Promise<ApiResult<User>> {
  return request({
    url: '/user/userInfo',
    method: 'get'
  })
}

export function updatePwd(data: UpdatePwdParams): Promise<ApiResult<null>> {
  return request({
    url: '/user/updatePwd',
    method: 'patch',
    data
  })
}

// ==================== 用户管理 ====================

export function getUserPage(query: UserQuery): Promise<ApiResult<PageResult<User>>> {
  return request({
    url: '/user/page',
    method: 'get',
    params: query
  })
}

export function createUser(data: UserCreateParams): Promise<ApiResult<User>> {
  return request({
    url: '/user/create',
    method: 'post',
    data
  })
}

export function updateUser(id: number, data: UserUpdateParams): Promise<ApiResult<null>> {
  return request({
    url: `/user/update/${id}`,
    method: 'put',
    data
  })
}

export function updateUserStatus(id: number, status: number): Promise<ApiResult<null>> {
  return request({
    url: `/user/status/${id}`,
    method: 'patch',
    data: { status }
  })
}

export function deleteUser(id: number): Promise<ApiResult<null>> {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

export function getUserRoles(id: number): Promise<ApiResult<Role[]>> {
  return request({
    url: `/user/roles/${id}`,
    method: 'get'
  })
}

export function assignUserRoles(userId: number, roleIds: number[]): Promise<ApiResult<null>> {
  return request({
    url: '/user/assignRoles',
    method: 'post',
    data: { userId, roleIds }
  })
}

export function resetUserPwd(id: number, newPassword: string): Promise<ApiResult<null>> {
  return request({
    url: `/user/resetPwd/${id}`,
    method: 'patch',
    data: { newPassword }
  })
}
