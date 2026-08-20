import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { OperationLog } from '@/types/permission'

export interface LogQuery {
  username?: string
  operation?: string
  page?: number
  pageSize?: number
}

export function getOperationLogPage(query: LogQuery): Promise<ApiResult<{ total: number; list: OperationLog[]; page: number; pageSize: number }>> {
  return request({
    url: '/log/page',
    method: 'get',
    params: query
  })
}
