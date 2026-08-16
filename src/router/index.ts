import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'

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

  return true
})

if (import.meta.env.DEV) {
  router.afterEach((to, from) => {
    console.log(`路由跳转: ${from.path} -> ${to.path}`)
  })
}

export default router
