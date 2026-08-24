import type { RouteRecordRaw } from 'vue-router'
import ParentView from '@/views/ParentView.vue'

/**
 * 常量路由（侧边栏菜单基于此配置生成）
 *
 * 权限说明：
 * - meta.perms 声明访问该菜单所需权限编码（任一匹配即可，见 src/utils/permission.ts）
 * - 权限编码与后端 permission 表 perm_code 对应，由角色分配
 * - 未配置 perms 的菜单（如仪表盘、个人资料等）仅需登录即可访问
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
        meta: { title: '入库管理', icon: 'Box', perms: ['inbound:page'] },
        children: [
          {
            path: 'inbound',
            name: 'Inbound',
            component: () => import('@/views/Inbound.vue'),
            meta: { title: '逐件入库', icon: 'ArrowDown', perms: ['inbound:page'] }
          },
          {
            path: 'inbound-by-order',
            name: 'InboundByOrder',
            component: () => import('@/views/InboundByOrder.vue'),
            meta: { title: '按订单入库', icon: 'DocumentChecked', perms: ['inbound:page'] }
          },
          {
            path: 'inbound-check',
            name: 'InboundOrderCheck',
            component: () => import('@/views/InboundOrderCheck.vue'),
            meta: { title: '入库订单信息核对', icon: 'CircleCheck', perms: ['inbound:page'], hidden: true }
          },
          {
            path: 'create-inbound',
            name: 'CreateInboundOrder',
            component: () => import('@/views/CreateInboundOrder.vue'),
            meta: { title: '创建入库订单', icon: 'DocumentAdd', perms: ['inbound:create'] }
          }
        ]
      },

      {
        path: 'warehouse',
        name: 'Warehouse',
        component: ParentView,
        redirect: '/warehouse/outbound',
        meta: { title: '仓库管理', icon: 'Box', perms: ['outbound:page', 'inventory:page', 'picking:page', 'relocation:page'] },
        children: [
          {
            path: 'outbound',
            name: 'Outbound',
            component: () => import('@/views/Outbound.vue'),
            meta: { title: '出库管理', icon: 'ArrowUp', perms: ['outbound:page'] }
          },
          {
            path: 'outbound-record',
            name: 'OutboundRecord',
            component: () => import('@/views/OutboundRecord.vue'),
            meta: { title: '出库记录', icon: 'Tickets', perms: ['outbound:page'] }
          },
          {
            path: 'put-away',
            name: 'PutAway',
            component: () => import('@/views/PutAway.vue'),
            meta: { title: '上架管理', icon: 'Upload', perms: ['inbound:page'] }
          },
          {
            path: 'down-shelf',
            name: 'DownShelf',
            component: () => import('@/views/DownShelf.vue'),
            meta: { title: '下架管理', icon: 'Download', perms: ['inventory:page'] }
          },
          {
            path: 'relocation',
            name: 'Relocation',
            component: () => import('@/views/Relocation.vue'),
            meta: { title: '移库管理', icon: 'Refresh', perms: ['relocation:page'] }
          }
        ]
      },

      {
        path: 'picking',
        name: 'PickingManagement',
        component: ParentView,
        redirect: '/picking/create-order',
        meta: { title: '拣货管理', icon: 'ShoppingCart', perms: ['picking:page'] },
        children: [
          {
            path: 'create-order',
            name: 'CreatePickingList',
            component: () => import('@/views/CreatePickingList.vue'),
            meta: { title: '创建拣货订单', icon: 'DocumentAdd', perms: ['picking:create'] }
          },
          {
            path: 'order-picking',
            name: 'Picking',
            component: () => import('@/views/Picking.vue'),
            meta: { title: '按订单拣货', icon: 'ShoppingCart', perms: ['picking:page'] }
          }
        ]
      },

      {
        path: 'inventory',
        name: 'Inventory',
        component: ParentView,
        redirect: '/inventory/query',
        meta: { title: '库存管理', icon: 'List', perms: ['inventory:page'] },
        children: [
          {
            path: 'query',
            name: 'Query',
            component: () => import('@/views/Query.vue'),
            meta: { title: '库存查询', icon: 'Search', perms: ['inventory:page'] }
          },
          {
            path: 'material-info',
            name: 'MaterialInfo',
            component: () => import('@/views/MaterialInfo.vue'),
            meta: { title: '物料信息', icon: 'Document', perms: ['inventory:page'] }
          },
          {
            path: 'import-material',
            name: 'ImportMaterial',
            component: () => import('@/views/ImportMaterialInfo.vue'),
            meta: { title: '导入物料', icon: 'Download', perms: ['inventory:import'] }
          }
        ]
      },

      {
        path: 'system',
        name: 'System',
        component: ParentView,
        redirect: '/system/user/list',
        meta: { title: '系统管理', icon: 'Setting', perms: ['user:page', 'role:page', 'permission:page', 'operationLog:page', 'tempAuth:page'] },
        children: [
          {
            path: 'user/list',
            name: 'UserList',
            component: () => import('@/views/user/list.vue'),
            meta: { title: '用户管理', icon: 'User', perms: ['user:page'] }
          },
          {
            path: 'temp-auth',
            name: 'TempAuth',
            component: () => import('@/views/system/tempAuth.vue'),
            meta: { title: '临时授权', icon: 'Timer', perms: ['tempAuth:page'] }
          },
          {
            path: 'user/profile',
            name: 'UserProfile',
            component: () => import('@/views/user/profile.vue'),
            meta: { title: '个人资料', icon: 'UserFilled', hidden: true }
          },
          {
            path: 'user/password',
            name: 'UserPassword',
            component: () => import('@/views/user/password.vue'),
            meta: { title: '修改密码', icon: 'Lock', hidden: true }
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/system/role.vue'),
            meta: { title: '角色管理', icon: 'Avatar', perms: ['role:page'] }
          },
          {
            path: 'menu',
            name: 'MenuManagement',
            component: () => import('@/views/system/menu.vue'),
            meta: { title: '菜单管理', icon: 'Menu', perms: ['permission:page'] }
          },
          {
            path: 'log',
            name: 'OperationLog',
            component: () => import('@/views/system/log.vue'),
            meta: { title: '操作日志', icon: 'Document', perms: ['operationLog:page'] }
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
        path: '403',
        name: 'Forbidden',
        component: () => import('@/views/error/403.vue'),
        meta: { title: '无权限', hidden: true }
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
