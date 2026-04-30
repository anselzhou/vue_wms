 <template>
   <el-container class="app-layout">
     <!-- 顶部导航栏 -->
     <Navbar />
 
     <!-- 主要内容区域 -->
     <el-container>
       <!-- 侧边栏抽屉 -->
       <SidebarDrawer ref="sidebarRef" />
 
       <!-- 主内容 -->
       <el-main class="app-main">
         <router-view v-slot="{ Component }">
           <transition name="fade-transform" mode="out-in">
             <keep-alive :include="cachedViews">
               <component :is="Component" :key="route.fullPath" />
             </keep-alive>
           </transition>
         </router-view>
       </el-main>
     </el-container>
   </el-container>
 </template>
 
 <script setup>
 import { ref, onMounted, watch } from 'vue'
 import { useRoute, useRouter } from 'vue-router'
 import Navbar from '@/components/Navbar.vue'
 import Sidebar from '@/components/Sidebar.vue'
 
 // 路由相关
 const route = useRoute()
 const router = useRouter()
 
 // 组件引用
 const sidebarRef = ref(null)
 
 // 缓存的页面
 const cachedViews = ref([])
 
 // 监听路由变化
 watch(
   () => route.path,
   (newPath) => {
     // 可以根据路由meta决定是否缓存页面
     if (route.meta.keepAlive) {
       cachedViews.value = [...new Set([...cachedViews.value, route.name])]
     }
   },
   { immediate: true }
 )
 
 // 监听全局事件
 onMounted(() => {
   window.addEventListener('toggle-sidebar', () => {
     if (sidebarRef.value) {
       sidebarRef.value.toggleDrawer()
     }
   })
 })
 </script>
 
 <style scoped>
 .app-layout {
   height: 100vh;
 }
 
 .app-main {
   padding: 20px;
   overflow-y: auto;
 }
 
 /* 页面切换动画 */
 .fade-transform-enter-active,
 .fade-transform-leave-active {
   transition: all 0.3s ease;
 }
 
 .fade-transform-enter-from {
   opacity: 0;
   transform: translateX(20px);
 }
 
 .fade-transform-leave-to {
   opacity: 0;
   transform: translateX(-20px);
 }
 </style>

