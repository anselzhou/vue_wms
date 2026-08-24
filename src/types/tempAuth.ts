/**
 * 用户临时授权相关类型
 * 对应后端 user_temp_permission 实体
 */

/** 临时授权状态：0待审批 1已通过 2已过期 3已撤销 */
export type TempAuthStatus = 0 | 1 | 2 | 3

export interface TempPermission {
  id: number
  /** 被授权用户ID */
  userId: number
  /** 被授权用户名（冗余字段，便于展示） */
  username?: string
  /** 权限标识，多个用逗号分隔（如 user:create,outbound:page） */
  permCodes?: string
  /** 权限标识数组（由 permCodes 拆分，便于表格展示） */
  permCodeList?: string[]
  /** 生效时间 */
  effectiveTime?: string
  /** 失效时间 */
  expireTime?: string
  /** 授权原因 */
  reason?: string
  /** 状态：0待审批 1已通过 2已过期 3已撤销 */
  status: TempAuthStatus
  /** 创建人 */
  createBy?: string
  createTime?: string
  updateTime?: string
}

export const TEMP_AUTH_STATUS_LABEL: Record<TempAuthStatus, string> = {
  0: '待审批',
  1: '已通过',
  2: '已过期',
  3: '已撤销'
}
