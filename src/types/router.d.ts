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
  }
}

export {}
