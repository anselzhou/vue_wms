import { createRouter, createWebHistory } from 'vue-router'
import { LayoutDashboard, Users, Settings, BarChart3 } from 'lucide-vue-next'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '首页', icon: LayoutDashboard, order: 1 }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: { title: '用户管理', icon: Users, order: 2 }
  },
  {
    path: '/charts',
    name: 'Charts',
    component: () => import('@/views/Charts.vue'),
    meta: { title: '数据统计', icon: BarChart3, order: 3 }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '系统设置', icon: Settings, order: 4 }
  },
  {
    path: '/material-import',
    name: 'MaterialImport',
    component: () => import('@/views/MaterialImport.vue'),
    meta: { title: '物料导入', icon: FileSpreadsheet }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import StockInOrder from '@/views/stock-in/Order.vue'
import StockInNoOrder from '@/views/stock-in/NoOrder.vue'
import StockInBatch from '@/views/stock-in/Batch.vue'
import StockOut from '@/views/StockOut.vue'
import Query from '@/views/Query.vue'
import Transfer from '@/views/Transfer.vue'
import Inventory from '@/views/Inventory.vue'
import SettingsUser from '@/views/settings/User.vue'
import SettingsRole from '@/views/settings/Role.vue'
import SettingsPermission from '@/views/settings/Permission.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Home, meta: { title: '主页' } },
  {
    path: '/stock-in',
    redirect: '/stock-in/order',
    meta: { title: '入库' },
    children: [
      { path: 'order', component: StockInOrder, meta: { title: '按订单入库' } },
      { path: 'no-order', component: StockInNoOrder, meta: { title: '无订单入库' } },
      { path: 'batch', component: StockInBatch, meta: { title: '批量入库' } }
    ]
  },
  { path: '/stock-out', component: StockOut, meta: { title: '出库' } },
  { path: '/query', component: Query, meta: { title: '查询' } },
  { path: '/transfer', component: Transfer, meta: { title: '移库' } },
  { path: '/inventory', component: Inventory, meta: { title: '盘点' } },
  {
    path: '/settings',
    redirect: '/settings/user',
    meta: { title: '设置' },
    children: [
      { path: 'user', component: SettingsUser, meta: { title: '用户管理' } },
      { path: 'role', component: SettingsRole, meta: { title: '角色管理' } },
      { path: 'permission', component: SettingsPermission, meta: { title: '权限管理' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router

