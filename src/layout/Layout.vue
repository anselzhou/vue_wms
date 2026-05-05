<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <Navbar @toggle-sidebar="toggleSidebar" />

    <!-- 侧边栏 -->
    <Sidebar :is-collapsed="isSidebarCollapsed" />

    <!-- 主内容区域 -->
    <main
      class="main-content"
      :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
    >
      <div class="content-wrapper">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && !isSidebarCollapsed"
      class="mobile-overlay"
      @click="toggleSidebar"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'

const isSidebarCollapsed = ref(false)
const isMobile = ref(false)

// 检测屏幕尺寸
const checkScreenSize = () => {
  const width = window.innerWidth
  isMobile.value = width <= 768
  // 移动端默认收起侧边栏
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

// 切换侧边栏状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 主内容区域 */
.main-content {
  margin-left: 250px;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
  transition: margin-left 0.3s ease;
  padding: 20px;
}

.main-content.sidebar-collapsed {
  margin-left: 64px;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* 移动端遮罩层 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 16px;
  }

  .main-content.sidebar-collapsed {
    margin-left: 0;
  }

  .content-wrapper {
    padding: 0;
  }
}

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    padding: 16px;
  }
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
