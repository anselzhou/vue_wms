import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string
    /** Element Plus 图标名 */
    icon?: string
    /** 是否需要登录，默认跟随父级 */
    requiresAuth?: boolean
    /** 侧边栏隐藏 */
    hidden?: boolean
    /** 侧边栏排序，越小越靠前 */
    order?: number
    /**
     * 访问/显示该页面所需的权限编码（任一匹配即可）
     * - 未配置：登录即可访问/显示
     * - 超级管理员（ADMIN 角色）始终放行
     */
    perms?: string[]
  }
}

export {}
