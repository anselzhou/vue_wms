import { getUserInfo, getToken } from './setUserInfo'

/** 超级管理员角色编码（与后端 PermissionInterceptor 保持一致） */
export const SUPER_ADMIN_ROLE_CODE = 'ADMIN'

/**
 * 获取当前登录用户的权限编码集合
 * - 优先从本地缓存的 userInfo 读取
 * - 无缓存时返回空数组
 */
export function getPermCodes(): string[] {
  const user = getUserInfo()
  return user?.permCodes ?? []
}

/**
 * 判断当前用户是否为超级管理员（拥有 ADMIN 角色）
 */
export function isSuperAdmin(): boolean {
  const user = getUserInfo()
  if (!user?.roles?.length) return false
  return user.roles.some((role) => role.roleCode === SUPER_ADMIN_ROLE_CODE)
}

/**
 * 判断当前用户是否具备指定权限编码（任一匹配即可）
 * - 未配置 required 或为空：视为无需权限
 * - 超级管理员始终放行
 */
export function hasPermission(required?: string[]): boolean {
  if (!required || required.length === 0) return true
  if (isSuperAdmin()) return true

  const owned = new Set(getPermCodes())
  return required.some((code) => owned.has(code))
}

/**
 * 判断用户是否已登录（token 是否存在）
 */
export function isLoggedIn(): boolean {
  return getToken() !== null
}

export default {
  getPermCodes,
  isSuperAdmin,
  hasPermission,
  isLoggedIn
}
