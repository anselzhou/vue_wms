import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { PageResult } from '@/types/user'
import type { TempPermission } from '@/types/tempAuth'

export interface TempAuthQuery {
  /** 用户名关键字 */
  username?: string
  /** 状态：0待审批 1已通过 2已过期 3已撤销 */
  status?: number
  page?: number
  pageSize?: number
}

export interface TempAuthCreateParams {
  /** 被授权用户ID */
  userId: number
  /** 权限标识数组（来自按钮权限，也支持自定义） */
  permCodes: string[]
  /** 生效时间（yyyy-MM-dd HH:mm:ss） */
  effectiveTime: string
  /** 失效时间（yyyy-MM-dd HH:mm:ss） */
  expireTime: string
  /** 授权原因 */
  reason?: string
}

export interface TempAuthUpdateParams {
  /** 生效时间 */
  effectiveTime: string
  /** 失效时间 */
  expireTime: string
  /** 授权原因 */
  reason?: string
}

export function getTempAuthPage(query: TempAuthQuery): Promise<ApiResult<PageResult<TempPermission>>> {
  return request({
    url: '/tempAuth/page',
    method: 'get',
    params: query
  })
}

export function getTempAuthDetail(id: number): Promise<ApiResult<TempPermission>> {
  return request({
    url: `/tempAuth/${id}`,
    method: 'get'
  })
}

export function createTempAuth(data: TempAuthCreateParams): Promise<ApiResult<TempPermission>> {
  return request({
    url: '/tempAuth/create',
    method: 'post',
    data
  })
}

export function updateTempAuth(id: number, data: TempAuthUpdateParams): Promise<ApiResult<null>> {
  return request({
    url: `/tempAuth/update/${id}`,
    method: 'put',
    data
  })
}

export function updateTempAuthStatus(id: number, status: number): Promise<ApiResult<null>> {
  return request({
    url: `/tempAuth/status/${id}`,
    method: 'patch',
    data: { status }
  })
}

/** 撤销临时授权 */
export function revokeTempAuth(id: number): Promise<ApiResult<null>> {
  return request({
    url: `/tempAuth/revoke/${id}`,
    method: 'patch'
  })
}
