 import { createRouter, createWebHistory } from 'vue-router'
 import Layout from '@/layout/Layout.vue'
 import Home from '@/views/Home.vue'
 import Inbound from '@/views/Inbound.vue'
 import Settings from '@/views/Settings.vue'
 
 const routes = [
   {
     path: '/',
     component: Layout,
     children: [
       { path: '', redirect: '/home' }, // 默认跳转到仪主页
       { path: 'home', component: Home, meta: { title: '主页' } },
       { path: 'inbound', component: Inbound, meta: { title: '入库' } },
       { path: 'putaway', component: Putaway, meta: { title: '上架' } },
       { path: 'relocation', component: Relocation, meta: { title: '移库' } },
       { path: 'picking', component: Picking, meta: { title: '拣货' } },
       { path: 'outboubd', component: Outbound, meta: { title: '出库' } },
       { path: 'search', component: Search, meta: { title: '库位查询' } },
       { path: 'importmaterialinfo', component: ImportMateriaIinfo, meta: { title: '导入物料信息' } },
       { path: 'settings', component: Settings, meta: { title: '系统设置' } }
     ]
   }
 ]
 
 const router = createRouter({
   history: createWebHistory(),
   routes
 })
 
 export default router
