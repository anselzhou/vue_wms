<template>
  <div class="flex h-screen overflow-hidden bg-zinc-950">
    <!-- 侧边栏（PC + 移动端抽屉） -->
    <Sidebar v-if="isOpen || !isMobile" />

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航栏 -->
      <header class="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 z-30">
        <button @click="toggleDrawer" class="lg:hidden p-2 hover:bg-zinc-800 rounded-lg">
          <Menu class="w-6 h-6 text-white" />
        </button>

        <div class="ml-4 text-white font-medium">管理系统</div>

        <div class="ml-auto flex items-center gap-4">
          <!-- 其他顶部内容 -->
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { Menu } from 'lucide-vue-next'

const isOpen = ref(false)

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}
</script>
