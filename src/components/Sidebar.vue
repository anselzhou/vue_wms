<template>
  <!-- 移动端遮罩 -->
  <div v-if="isMobile && isOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="isOpen = false" />

  <!-- 侧边栏 -->
  <aside :class="[
    'fixed lg:static top-0 left-0 h-screen bg-zinc-900 text-white z-50',
    'transition-all duration-300 ease-in-out overflow-hidden',
    collapsed && !isMobile ? 'w-20' : 'w-64'
  ]">
    <div class="h-full flex flex-col">
      <!-- 顶部 Logo + 折叠按钮 -->
      <div class="p-4 flex items-center justify-between border-b border-zinc-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
            R
          </div>
          <span v-if="!collapsed || isMobile" class="font-semibold text-xl transition-opacity">
            RuoYi
          </span>
        </div>

        <!-- PC 端折叠按钮 -->
        <button v-if="!isMobile" @click="toggleCollapse" class="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
          <ChevronLeft :class="{ 'rotate-180': collapsed }" class="w-5 h-5 transition-transform duration-300" />
        </button>
      </div>

      <!-- 动态菜单 -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <a v-for="item in menuList" :key="item.path" @click="navigate(item)" :class="[
          'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group',
          isActive(item.path) ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/70'
        ]">
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!collapsed || isMobile" class="transition-opacity duration-300 whitespace-nowrap">
            {{ item.title }}
          </span>
        </a>
      </nav>

      <!-- 底部 -->
      <div class="p-4 border-t border-zinc-800 mt-auto">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-zinc-700 rounded-full flex-shrink-0"></div>
          <div v-if="!collapsed || isMobile" class="text-sm truncate">
            <div class="font-medium">Ansel</div>
            <div class="text-zinc-400 text-xs">管理员</div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

// ==================== 动态菜单配置 ====================
const router = useRouter()
const route = useRoute()

// 只显示需要出现在菜单中的路由（通过 meta.hidden 控制）
const menuList = computed(() => {
  return router.getRoutes()
    .filter(r => {
      return r.meta?.title &&          // 有标题
        !r.meta?.hidden &&        // 未隐藏
        !r.path.includes(':') &&  // 排除动态参数路由
        r.path !== '*'            // 排除通配符
    })
    .map(r => ({
      title: r.meta.title,
      icon: r.meta.icon || null,       // 路由 meta 中定义 icon
      path: r.path
    }))
    .sort((a, b) => (a.meta?.order || 999) - (b.meta?.order || 999)) // 支持排序
})

// ==================== 状态管理 ====================
const isOpen = ref(false)           // 移动端抽屉
const collapsed = ref(false)        // PC 端折叠状态

// 从 localStorage 恢复折叠状态
onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    collapsed.value = saved === 'true'
  }
})

// 持久化到 localStorage
watch(collapsed, (newVal) => {
  localStorage.setItem('sidebar-collapsed', newVal)
})

// ==================== 方法 ====================
const isMobile = computed(() => window.innerWidth < 1024)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const navigate = (item) => {
  router.push(item.path)
  if (isMobile.value) isOpen.value = false
}

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// 窗口大小变化处理
let resizeTimer
onMounted(() => {
  const handleResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (!isMobile.value) isOpen.value = false
    }, 150)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => window.removeEventListener('resize', () => { }))
</script>

// 纳米AI
/*
<template>
  <div class="sidebar-container">
    <!-- 汉堡菜单按钮 -->
    <div class="menu-toggle" @click="toggleDrawer">
      <i :class="isOpen ? 'el-icon-menu-fold' : 'el-icon-menu-unfold'"></i>
    </div>

    <!-- 侧边栏抽屉 -->
    <el-drawer v-model="isOpen" direction="ltr" :with-header="false" :size="sidebarWidth" class="sidebar-drawer"
      :before-close="handleBeforeClose">
      <!-- 多级菜单 -->
      <el-menu :default-active="activeMenu" :router="useRouter" mode="vertical" background-color="#fff"
        text-color="#303133" active-text-color="#409EFF" class="sidebar-menu">
        <!-- 主页 -->
        <el-menu-item index="/home">
          <el-icon>
            <House />
          </el-icon>
          <span slot="title">主页</span>
        </el-menu-item>

        <!-- 入库（二级菜单） -->
        <el-sub-menu index="/stock-in">
          <template #title>
            <el-icon>
              <Box />
            </el-icon>
            <span>入库</span>
          </template>
          <el-menu-item index="/stock-in/order">
            <el-icon>
              <Ticket />
            </el-icon>
            <span slot="title">按订单入库</span>
          </el-menu-item>
          <el-menu-item index="/stock-in/no-order">
            <el-icon>
              <ShoppingBag />
            </el-icon>
            <span slot="title">无订单入库</span>
          </el-menu-item>
          <el-menu-item index="/stock-in/batch">
            <el-icon>
              <Grid />
            </el-icon>
            <span slot="title">批量入库</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 出库 -->
        <el-menu-item index="/stock-out">
          <el-icon>
            <ArrowRight />
          </el-icon>
          <span slot="title">出库</span>
        </el-menu-item>

        <!-- 查询 -->
        <el-menu-item index="/query">
          <el-icon>
            <Search />
          </el-icon>
          <span slot="title">查询</span>
        </el-menu-item>

        <!-- 移库 -->
        <el-menu-item index="/transfer">
          <el-icon>
            <Swap />
          </el-icon>
          <span slot="title">移库</span>
        </el-menu-item>

        <!-- 盘点 -->
        <el-menu-item index="/inventory">
          <el-icon>
            <List />
          </el-icon>
          <span slot="title">盘点</span>
        </el-menu-item>

        <!-- 设置 -->
        <el-sub-menu index="/settings">
          <template #title>
            <el-icon>
              <Setting />
            </el-icon>
            <span>设置</span>
          </template>
          <el-menu-item index="/settings/user">
            <el-icon>
              <User />
            </el-icon>
            <span slot="title">用户管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/role">
            <el-icon>
              <UserFilled />
            </el-icon>
            <span slot="title">角色管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/permission">
            <el-icon>
              <Key />
            </el-icon>
            <span slot="title">权限管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-drawer>
  </div>
</template>

<script setup>
 import { ref, computed, onMounted, onUnmounted } from 'vue'
 import { useRoute, useRouter } from 'vue-router'
 import { ElMessage } from 'element-plus'
 import { 
   House, Box, Ticket, ShoppingBag, Grid, 
   ArrowRight, Search, Swap, List, Setting,
   User, UserFilled, Key 
 } from '@element-plus/icons-vue'
 
 // 响应式数据
 const isOpen = ref(false)
 const sidebarWidth = ref('250px')
 const useRouter = ref(true)
 
 // 当前路由
 const route = useRoute()
 const router = useRouter()
 
 // 当前激活的菜单
 const activeMenu = computed(() => {
   const { path } = route
   return path
 })
 
 // 切换抽屉
 const toggleDrawer = () => {
   isOpen.value = !isOpen.value
 }
 
 // 抽屉关闭前的回调
 const handleBeforeClose = (done) => {
   ElMessageBox.confirm('确定要关闭侧边栏吗？')
     .then(() => {
       done()
     })
     .catch(() => {
       // 不关闭抽屉
     })
 }
 
 // 响应式调整侧边栏宽度
 const handleResize = () => {
   if (window.innerWidth < 768) {
     sidebarWidth.value = '200px'
   } else {
     sidebarWidth.value = '250px'
   }
 }
 
 // 生命周期钩子
 onMounted(() => {
   window.addEventListener('resize', handleResize)
   handleResize() // 初始化时调用一次
 })
 
 onUnmounted(() => {
   window.removeEventListener('resize', handleResize)
 })
 </script>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}

.menu-toggle {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
}

.menu-toggle:hover {
  background-color: #f5f7fa;
}

.sidebar-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

.sidebar-menu .el-menu-item {
  padding-left: 40px !important;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  padding-left: 60px !important;
}

.sidebar-menu .el-menu-item .el-icon {
  margin-right: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-menu .el-menu-item {
    padding-left: 30px !important;
  }

  .sidebar-menu .el-sub-menu .el-menu-item {
    padding-left: 50px !important;
  }
}
</style>
*/
