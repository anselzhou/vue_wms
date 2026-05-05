<template>
  <nav class="navbar">
    <div class="navbar-left">
      <!-- 侧边栏切换按钮 -->
      <button @click="handleToggleSidebar" class="sidebar-toggle-btn" title="切换侧边栏">
        <el-icon :size="20">
          <Fold v-if="!isMobile" />
          <Expand v-else />
        </el-icon>
      </button>

      <!-- Logo -->
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="24">
            <Box />
          </el-icon>
        </div>
        <span class="logo-text">WMS</span>
      </div>
    </div>

    <!-- 中间导航链接 -->
    <div class="navbar-center">
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        class="top-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧功能区 -->
    <div class="navbar-right">
      <!-- 通知 -->
      <el-badge :value="3" class="notification-badge">
        <el-button circle size="default">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>

      <!-- 用户下拉菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <el-avatar :size="36" icon="UserFilled" />
          <span class="username">管理员</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Fold,
  Expand,
  Bell,
  User,
  Setting,
  House,
  Box,
  ArrowDown,
  UserFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 检测是否为移动端
const isMobile = computed(() => {
  return window.innerWidth <= 768
})

// 切换侧边栏
const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

// 顶部菜单选择
const handleMenuSelect = (index: string) => {
  router.push(index)
}

// 用户下拉菜单命令处理
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 清除本地存储的认证信息
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        ElMessage.success('已退出登录')

        // 跳转到登录页
        router.push('/login')
      } catch {
        // 用户取消操作
      }
      break
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  border-bottom: 1px solid #e6e0e9;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: #49454f;
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  background-color: #f5f7fa;
  color: #6750a4;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6750a4, #958da5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1d1b20;
  letter-spacing: -0.5px;
}

.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.top-menu {
  border-bottom: none;
  background: transparent;
}

.top-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.top-menu :deep(.el-menu-item.is-active) {
  background-color: #f5f0ff;
  color: #6750a4;
  border-bottom-color: #6750a4;
}

.top-menu :deep(.el-menu-item:hover) {
  background-color: #f5f0ff;
  color: #6750a4;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-profile:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #1d1b20;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
  }

  .logo-text {
    display: none;
  }

  .navbar-center {
    display: none;
  }

  .username {
    display: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .logo-text {
    font-size: 18px;
  }

  .username {
    font-size: 13px;
  }
}
</style>
