import type { RouteRecordRaw } from 'vue-router'
import ParentView from '@/views/ParentView.vue'

/**
 * 常量路由（侧边栏菜单基于此配置生成）
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },

  {
    path: '/',
    component: () => import('@/layout/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'House' }
      },

      {
        path: 'inbound-management',
        name: 'InboundManagement',
        component: ParentView,
        redirect: '/inbound-management/inbound',
        meta: { title: '入库管理', icon: 'Box' },
        children: [
          {
            path: 'inbound',
            name: 'Inbound',
            component: () => import('@/views/Inbound.vue'),
            meta: { title: '逐件入库', icon: 'ArrowDown' }
          },
          {
            path: 'create-inbound',
            name: 'CreateInboundOrder',
            component: () => import('@/views/CreateInboundOrder.vue'),
            meta: { title: '创建入库订单', icon: 'DocumentAdd' }
          }
        ]
      },

      {
        path: 'warehouse',
        name: 'Warehouse',
        component: ParentView,
        redirect: '/warehouse/outbound',
        meta: { title: '仓库管理', icon: 'Box' },
        children: [
          {
            path: 'outbound',
            name: 'Outbound',
            component: () => import('@/views/Outbound.vue'),
            meta: { title: '出库管理', icon: 'ArrowUp' }
          },
          {
            path: 'outbound-record',
            name: 'OutboundRecord',
            component: () => import('@/views/OutboundRecord.vue'),
            meta: { title: '出库记录', icon: 'Tickets' }
          },
          {
            path: 'put-away',
            name: 'PutAway',
            component: () => import('@/views/PutAway.vue'),
            meta: { title: '上架管理', icon: 'Upload' }
          },
          {
            path: 'down-shelf',
            name: 'DownShelf',
            component: () => import('@/views/DownShelf.vue'),
            meta: { title: '下架管理', icon: 'Download' }
          },
          {
            path: 'relocation',
            name: 'Relocation',
            component: () => import('@/views/Relocation.vue'),
            meta: { title: '移库管理', icon: 'Refresh' }
          }
        ]
      },

      {
        path: 'picking',
        name: 'PickingManagement',
        component: ParentView,
        redirect: '/picking/create-order',
        meta: { title: '拣货管理', icon: 'ShoppingCart' },
        children: [
          {
            path: 'create-order',
            name: 'CreatePickingList',
            component: () => import('@/views/CreatePickingList.vue'),
            meta: { title: '创建拣货订单', icon: 'DocumentAdd' }
          },
          {
            path: 'order-picking',
            name: 'Picking',
            component: () => import('@/views/Picking.vue'),
            meta: { title: '按订单拣货', icon: 'ShoppingCart' }
          }
        ]
      },

      {
        path: 'inventory',
        name: 'Inventory',
        component: ParentView,
        redirect: '/inventory/query',
        meta: { title: '库存管理', icon: 'List' },
        children: [
          {
            path: 'query',
            name: 'Query',
            component: () => import('@/views/Query.vue'),
            meta: { title: '库存查询', icon: 'Search' }
          },
          {
            path: 'material-info',
            name: 'MaterialInfo',
            component: () => import('@/views/MaterialInfo.vue'),
            meta: { title: '物料信息', icon: 'Document' }
          },
          {
            path: 'import-material',
            name: 'ImportMaterial',
            component: () => import('@/views/ImportMaterialInfo.vue'),
            meta: { title: '导入物料', icon: 'Download' }
          }
        ]
      },

      {
        path: 'system',
        name: 'System',
        component: ParentView,
        redirect: '/system/user/list',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user/list',
            name: 'UserList',
            component: () => import('@/views/user/list.vue'),
            meta: { title: '用户管理', icon: 'User' }
          },
          {
            path: 'user/profile',
            name: 'UserProfile',
            component: () => import('@/views/user/profile.vue'),
            meta: { title: '个人资料', icon: 'UserFilled', hidden: true }
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/system/role.vue'),
            meta: { title: '角色管理', icon: 'Avatar' }
          },
          {
            path: 'menu',
            name: 'MenuManagement',
            component: () => import('@/views/system/menu.vue'),
            meta: { title: '菜单管理', icon: 'Menu' }
          }
        ]
      },

      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: { title: '关于', icon: 'InfoFilled' }
      },

      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置', icon: 'Tools', hidden: true }
      },

      {
        path: ':pathMatch(.*)*',
        name: 'LayoutNotFound',
        component: () => import('@/views/error/404.vue'),
        meta: { title: '页面不存在', hidden: true },
        props: { embedded: true }
      }
    ]
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', requiresAuth: false }
  }
]
