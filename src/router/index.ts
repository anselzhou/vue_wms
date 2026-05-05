// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes: Array<RouteRecordRaw> = [
  // 认证相关路由（不需要登录）
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },

  // 主应用路由（需要登录）
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'House',
          requiresAuth: true,
          order: 1
        }
      }
    ]
  },

  // 仓库管理模块
  {
    path: '/warehouse',
    component: Layout,
    redirect: '/warehouse/inbound',
    meta: {
      title: '仓库管理',
      icon: 'Box',
      requiresAuth: true,
      order: 2
    },
    children: [
      {
        path: 'inbound',
        name: 'Inbound',
        component: () => import('@/views/Inbound.vue'),
        meta: {
          title: '入库管理',
          icon: 'ArrowDown',
          requiresAuth: true
        }
      },
      {
        path: 'outbound',
        name: 'Outbound',
        component: () => import('@/views/Outbound.vue'),
        meta: {
          title: '出库管理',
          icon: 'ArrowUp',
          requiresAuth: true
        }
      },
      {
        path: 'picking',
        name: 'Picking',
        component: () => import('@/views/Picking.vue'),
        meta: {
          title: '拣货管理',
          icon: 'ShoppingCart',
          requiresAuth: true
        }
      },
      {
        path: 'putAway',
        name: 'PutAway',
        component: () => import('@/views/PutAway.vue'),
        meta: {
          title: '上架管理',
          icon: 'Upload',
          requiresAuth: true
        }
      },
      {
        path: 'relocation',
        name: 'Relocation',
        component: () => import('@/views/Relocation.vue'),
        meta: {
          title: '移库管理',
          icon: 'Refresh',
          requiresAuth: true
        }
      }
    ]
  },

  // 库存管理模块
  {
    path: '/inventory',
    component: Layout,
    redirect: '/inventory/query',
    meta: {
      title: '库存管理',
      icon: 'List',
      requiresAuth: true,
      order: 3
    },
    children: [
      {
        path: 'query',
        name: 'Query',
        component: () => import('@/views/Query.vue'),
        meta: {
          title: '库存查询',
          icon: 'Search',
          requiresAuth: true
        }
      },
      {
        path: 'material-info',
        name: 'MaterialInfo',
        component: () => import('@/views/MaterialInfo.vue'),
        meta: {
          title: '物料信息',
          icon: 'Document',
          requiresAuth: true
        }
      },
      {
        path: 'import-material',
        name: 'ImportMaterial',
        component: () => import('@/views/ImportMaterialInfo.vue'),
        meta: {
          title: '导入物料',
          icon: 'Download',
          requiresAuth: true
        }
      }
    ]
  },

  // 系统管理模块
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user/list',
    meta: {
      title: '系统管理',
      icon: 'Setting',
      requiresAuth: true,
      order: 4
    },
    children: [
      {
        path: 'user/list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          requiresAuth: true
        }
      },
      {
        path: 'user/profile',
        name: 'UserProfile',
        component: () => import('@/views/user/profile.vue'),
        meta: {
          title: '个人资料',
          icon: 'UserFilled',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'role',
        name: 'RoleManagement',
        component: () => import('@/views/system/role.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserGroup',
          requiresAuth: true
        }
      },
      {
        path: 'menu',
        name: 'MenuManagement',
        component: () => import('@/views/system/menu.vue'),
        meta: {
          title: '菜单管理',
          icon: 'Menu',
          requiresAuth: true
        }
      }
    ]
  },

  // 关于页面
  {
    path: '/about',
    component: Layout,
    meta: {
      title: '关于',
      icon: 'InfoFilled',
      requiresAuth: true,
      order: 5
    },
    children: [
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: {
          title: '关于',
          icon: 'InfoFilled',
          requiresAuth: true
        }
      }
    ]
  },

  // 设置页面
  {
    path: '/settings',
    component: Layout,
    meta: {
      title: '设置',
      icon: 'Tools',
      requiresAuth: true,
      hidden: true
    },
    children: [
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: {
          title: '设置',
          icon: 'Tools',
          requiresAuth: true
        }
      }
    ]
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 如果页面有缓存位置，返回到该位置
    if (savedPosition) {
      return savedPosition
    } else {
      // 否则滚动到顶部
      return { top: 0 }
    }
  }
})

// 全局前置路由守卫
router.beforeEach((to, _from) => {
  // 设置页面标题
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = `${title} - WMS系统`
  } else {
    document.title = 'WMS系统'
  }

  // 检查是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('token') !== null

  if (requiresAuth && !isAuthenticated) {
    // 未登录用户重定向到登录页
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
  
  if (to.path === '/login' || to.path === '/register') {
    // 如果已登录且访问登录或注册页，重定向到首页
    if (isAuthenticated) {
      return '/dashboard'
    }
  }
  
  // 继续导航
  return true
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 仅在开发环境记录路由跳转日志
  if (import.meta.env.DEV) {
    console.log(`路由跳转: ${from.path} -> ${to.path}`)
  }
})

export default router
