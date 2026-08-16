<template>
  <nav class="navbar">
    <div class="navbar-left">
      <button @click="handleToggleSidebar" class="sidebar-toggle-btn" title="切换侧边栏">
        <el-icon :size="20">
          <Fold v-if="!isMobile" />
          <Expand v-else />
        </el-icon>
      </button>

      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="24">
            <Box />
          </el-icon>
        </div>
        <span class="logo-text">WMS</span>
      </div>
    </div>

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

    <div class="navbar-right">
      <!-- 主题下拉选择 -->
      <el-dropdown
        trigger="click"
        popper-class="wms-theme-dropdown"
        @command="handleThemeSelect"
      >
        <el-button class="theme-select-btn" circle>
          <el-icon :size="18"><Brush /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="opt in themeOptions"
              :key="opt.name"
              :command="opt.name"
              :class="{ 'is-theme-selected': theme === opt.name }"
            >
              <span class="theme-option">
                <span class="theme-swatch" :style="{ background: opt.swatch }" />
                <span class="theme-option-text">
                  <span class="theme-option-label">{{ opt.label }}</span>
                  <span class="theme-option-desc">{{ opt.description }}</span>
                </span>
                <el-icon v-if="theme === opt.name" class="theme-check"><Check /></el-icon>
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-badge :value="3" class="notification-badge">
        <el-button circle size="default">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>

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
import { computed } from 'vue'
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
  SwitchButton,
  Brush,
  Check
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTheme, type ThemeName } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const { theme, themeOptions, setTheme } = useTheme()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const activeMenu = computed(() => route.path)

const isMobile = computed(() => window.innerWidth <= 768)

const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

const handleThemeSelect = (name: ThemeName) => {
  if (name === theme.value) return
  setTheme(name)
  const label = themeOptions.find((t) => t.name === name)?.label ?? name
  ElMessage.success({
    message: `已切换为「${label}」主题`,
    duration: 1500
  })
}

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/system/user/profile')
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

        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消
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
  background: var(--wms-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  border-bottom: 1px solid var(--wms-border);
  transition: background-color 0.25s ease, border-color 0.25s ease;
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
  border-radius: var(--wms-radius);
  cursor: pointer;
  color: var(--wms-text-secondary);
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  background-color: var(--wms-hover-bg);
  color: var(--wms-primary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--wms-logo-from), var(--wms-logo-to));
  border-radius: var(--wms-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wms-on-primary);
  transition: background 0.25s ease;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--wms-text);
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
  background-color: var(--wms-primary-bg);
  color: var(--wms-primary);
  border-bottom-color: var(--wms-primary);
}

.top-menu :deep(.el-menu-item:hover) {
  background-color: var(--wms-primary-bg);
  color: var(--wms-primary);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-select-btn {
  color: var(--wms-text-secondary);
  border-color: var(--wms-border);
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.theme-select-btn:hover {
  color: var(--wms-primary);
  border-color: var(--wms-primary);
  background-color: var(--wms-primary-bg);
}

.notification-badge {
  margin-right: 4px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--wms-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-profile:hover {
  background-color: var(--wms-hover-bg);
}

.username {
  font-size: 14px;
  color: var(--wms-text);
  font-weight: 500;
}

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

<style>
/* 下拉挂到 body，需非 scoped */
.wms-theme-dropdown .theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  padding: 2px 0;
}

.wms-theme-dropdown .theme-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.wms-theme-dropdown .theme-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.wms-theme-dropdown .theme-option-label {
  font-size: 13px;
  color: var(--wms-text);
  line-height: 1.3;
}

.wms-theme-dropdown .theme-option-desc {
  font-size: 11px;
  color: var(--wms-text-secondary);
  line-height: 1.3;
}

.wms-theme-dropdown .theme-check {
  color: var(--wms-primary);
  flex-shrink: 0;
}

.wms-theme-dropdown .el-dropdown-menu__item.is-theme-selected {
  background-color: var(--wms-primary-bg);
}
</style>
