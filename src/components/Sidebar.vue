 <template>
   <el-aside :width="isOpen ? '250px' : '0'" class="sidebar-aside">
     <el-menu
       :default-active="activeMenu"
       :router="true"
       mode="vertical"
       background-color="#fff"
       text-color="#303133"
       active-text-color="#409EFF"
       class="sidebar-menu"
       :collapse="!isOpen"
       :unique-opened="true"
     >
       <!-- 主页 -->
       <el-menu-item index="/home">
         <template #icon><el-icon><House /></el-icon></template>
         <template #title><span>主页</span></template>
       </el-menu-item>
 
       <!-- 入库（二级菜单） -->
       <el-sub-menu index="/stock-in">
         <template #title>
           <el-icon><Box /></el-icon>
           <span>入库</span>
         </template>
         
         <el-menu-item index="/stock-in/order">
           <template #icon><el-icon><Ticket /></el-icon></template>
           <template #title><span>按订单入库</span></template>
         </el-menu-item>
         
         <el-menu-item index="/stock-in/no-order">
           <template #icon><el-icon><ShoppingBag /></el-icon></template>
           <template #title><span>无订单入库</span></template>
         </el-menu-item>
         
         <el-menu-item index="/stock-in/batch">
           <template #icon><el-icon><Grid /></el-icon></template>
           <template #title><span>批量入库</span></template>
         </el-menu-item>
       </el-sub-menu>
 
       <!-- 出库 -->
     <el-menu-item index="/stock-out">
      <template #icon>
        <ArrowRight />
      </template>
      <template #title>
        <span>出库</span>
      </template>
    </el-menu-item>
 
       <!-- 查询 -->
       <el-menu-item index="/query">
         <template #icon><el-icon><Search /></el-icon></template>
         <template #title><span>查询</span></template>
       </el-menu-item>
 
       <!-- 移库 -->
       <el-menu-item index="/transfer">
         <template #icon><el-icon><Swap /></el-icon></template>
         <template #title><span>移库</span></template>
       </el-menu-item>
 
       <!-- 盘点 -->
       <el-menu-item index="/inventory">
         <template #icon><el-icon><List /></el-icon></template>
         <template #title><span>盘点</span></template>
       </el-menu-item>
 
       <!-- 设置 -->
       <el-sub-menu index="/settings">
         <template #title>
           <el-icon><Setting /></el-icon>
           <span>设置</span>
         </template>
         
         <el-menu-item index="/settings/user">
           <template #icon><el-icon><User /></el-icon></template>
           <template #title><span>用户管理</span></template>
         </el-menu-item>
         
         <el-menu-item index="/settings/role">
           <template #icon><el-icon><UserFilled /></el-icon></template>
           <template #title><span>角色管理</span></template>
         </el-menu-item>
         
         <el-menu-item index="/settings/permission">
           <template #icon><el-icon><Key /></el-icon></template>
           <template #title><span>权限管理</span></template>
         </el-menu-item>
       </el-sub-menu>
     </el-menu>
   </el-aside>
 </template>
 
 <script setup>
 import { ref, computed, onMounted } from 'vue'
 import { useRoute } from 'vue-router'
 import { 
   House, Box, Ticket, ShoppingBag, Grid, 
   ArrowRight, Search, Swap, List, Setting,
   User, UserFilled, Key 
 } from '@element-plus/icons-vue'
 
 // 当前路由
 const route = useRoute()
 
 // 侧边栏状态
 const isOpen = ref(true)
 
 // 当前激活的菜单
 const activeMenu = computed(() => {
   const { path } = route
   return path
 })
 
 // 切换侧边栏
 const toggleDrawer = () => {
   isOpen.value = !isOpen.value
 }
 
 // 监听全局事件
 onMounted(() => {
   window.addEventListener('toggle-sidebar', toggleDrawer)
 })
 
 // 暴露方法给父组件
 defineExpose({
   toggleDrawer
 })
 </script>
 
 <style scoped>
 .sidebar-aside {
   transition: width 0.3s ease;
   overflow: hidden;
   border-right: 1px solid #e6e6e6;
 }
 
 .sidebar-menu {
   height: 100%;
   border-right: none;
 }
 
 /* 响应式设计 */
 @media (max-width: 768px) {
   .sidebar-aside {
     position: fixed;
     top: 60px; /* 顶部Navbar高度 */
     left: 0;
     z-index: 999;
     height: calc(100vh - 60px);
   }
 }
 </style>

