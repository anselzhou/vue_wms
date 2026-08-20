import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { Permission, PermType } from '@/types/permission'

export interface PermissionParams {
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
}

export function getPermissionTree(): Promise<ApiResult<Permission[]>> {
  return request({
    url: '/permission/tree',
    method: 'get'
  })
}

export function getPermissionList(): Promise<ApiResult<Permission[]>> {
  return request({
    url: '/permission/list',
    method: 'get'
  })
}

export function getPermissionDetail(id: number): Promise<ApiResult<Permission>> {
  return request({
    url: `/permission/${id}`,
    method: 'get'
  })
}

export function createPermission(data: PermissionParams): Promise<ApiResult<Permission>> {
  return request({
    url: '/permission/create',
    method: 'post',
    data
  })
}

export function updatePermission(id: number, data: PermissionParams): Promise<ApiResult<Permission>> {
  return request({
    url: `/permission/update/${id}`,
    method: 'put',
    data
  })
}

export function deletePermission(id: number): Promise<ApiResult<null>> {
  return request({
    url: `/permission/${id}`,
    method: 'delete'
  })
}
