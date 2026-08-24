import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { hasPermission } from '@/utils/permission'

export { constantRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  }
})

const WHITE_LIST = new Set(['/login', '/register'])

function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

/**
 * 是否为 404 路由（Layout 内部 catch-all 或顶层 catch-all）
 */
function isNotFoundRoute(name: unknown): boolean {
  return name === 'LayoutNotFound' || name === 'NotFound'
}

router.beforeEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} - WMS系统` : 'WMS系统'

  // 未登录用户访问不存在的路径 → 重定向到独立 404 页，避免渲染需要鉴权的 Layout
  if (to.name === 'LayoutNotFound' && !isAuthenticated()) {
    return { name: 'NotFound' }
  }

  // 404 路由本身不需要登录校验
  if (isNotFoundRoute(to.name)) {
    return true
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true)

  if (requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (WHITE_LIST.has(to.path) && isAuthenticated()) {
    return '/dashboard'
  }

  // 已登录且非白名单：校验当前路由的菜单权限
  if (requiresAuth && isAuthenticated()) {
    // 逐级校验：父路由（如系统管理）与当前路由（如用户管理）的权限均需满足
    const matched = [...to.matched]
    // 忽略 Layout 根记录（无 perms）
    for (const record of matched) {
      if (record.meta?.perms && !hasPermission(record.meta.perms)) {
        // 已登录但无权限 → 重定向到 403（Layout 内部版本，保留导航栏/侧边栏）
        return { path: '/403', replace: true }
      }
    }
  }

  return true
})

if (import.meta.env.DEV) {
  router.afterEach((to, from) => {
    console.log(`路由跳转: ${from.path} -> ${to.path}`)
  })
}

export default router
