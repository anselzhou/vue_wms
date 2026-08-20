import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { PageResult, Role } from '@/types/user'

export interface RoleQuery {
  keyword?: string
  page?: number
  pageSize?: number
}

export interface RoleParams {
  roleCode: string
  roleName: string
  description?: string
  dataScope?: string
  status?: number
}

export function getRoleList(): Promise<ApiResult<Role[]>> {
  return request({
    url: '/role/list',
    method: 'get'
  })
}

export function getRolePage(query: RoleQuery): Promise<ApiResult<PageResult<Role>>> {
  return request({
    url: '/role/page',
    method: 'get',
    params: query
  })
}

export function getRoleDetail(id: number): Promise<ApiResult<Role>> {
  return request({
    url: `/role/${id}`,
    method: 'get'
  })
}

export function createRole(data: RoleParams): Promise<ApiResult<Role>> {
  return request({
    url: '/role/create',
    method: 'post',
    data
  })
}

export function updateRole(id: number, data: RoleParams): Promise<ApiResult<Role>> {
  return request({
    url: `/role/update/${id}`,
    method: 'put',
    data
  })
}

export function updateRoleStatus(id: number, status: number): Promise<ApiResult<null>> {
  return request({
    url: `/role/status/${id}`,
    method: 'patch',
    data: { status }
  })
}

export function deleteRole(id: number): Promise<ApiResult<null>> {
  return request({
    url: `/role/${id}`,
    method: 'delete'
  })
}

export function getRolePermissionIds(id: number): Promise<ApiResult<number[]>> {
  return request({
    url: `/role/permissionIds/${id}`,
    method: 'get'
  })
}

export function assignRolePermissions(roleId: number, permissionIds: number[]): Promise<ApiResult<null>> {
  return request({
    url: '/role/assignPermissions',
    method: 'post',
    data: { roleId, permissionIds }
  })
}
