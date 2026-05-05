<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :router="true"
        mode="vertical"
        background-color="#ffffff"
        text-color="#49454f"
        active-text-color="#6750a4"
        :collapse="isCollapsed"
        :unique-opened="true"
        :collapse-transition="false"
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <!-- 有子菜单 -->
          <el-sub-menu
            v-if="shouldShowSubMenu(route)"
            :index="route.path"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon && typeof route.meta.icon === 'string'">
                <component :is="getIconComponent(route.meta.icon)" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>

            <el-menu-item
              v-for="child in getVisibleChildren(route)"
              :key="child.path"
              :index="resolveChildPath(route.path, child.path)"
            >
              <el-icon v-if="child.meta?.icon && typeof child.meta.icon === 'string'">
                <component :is="getIconComponent(child.meta.icon)" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 无子菜单的单一路由 -->
          <el-menu-item
            v-else-if="hasSingleVisibleChild(route)"
            :index="resolveChildPath(route.path, route.children![0].path)"
          >
            <el-icon v-if="route.meta?.icon && typeof route.meta.icon === 'string'">
              <component :is="getIconComponent(route.meta.icon)" />
            </el-icon>
            <template #title>{{ route.children![0].meta?.title }}</template>
          </el-menu-item>

          <!-- 直接显示的路由（没有子菜单） -->
          <el-menu-item
            v-else-if="!route.children || route.children.length === 0"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon && typeof route.meta.icon === 'string'">
              <component :is="getIconComponent(route.meta.icon)" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

interface Props {
  isCollapsed: boolean
}

defineProps<Props>()

const route = useRoute()
const router = useRouter()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 获取可见的子路由（排除隐藏的）
const getVisibleChildren = (route: RouteRecordRaw): RouteRecordRaw[] => {
  if (!route.children) return []
  return route.children.filter(child => !child.meta?.hidden)
}

// 判断是否应该显示子菜单
const shouldShowSubMenu = (route: RouteRecordRaw): boolean => {
  if (!route.children || route.children.length === 0) {
    return false
  }
  const visibleChildren = getVisibleChildren(route)
  return visibleChildren.length > 1
}

// 判断是否只有一个可见子项
const hasSingleVisibleChild = (route: RouteRecordRaw): boolean => {
  if (!route.children || route.children.length === 0) {
    return false
  }
  const visibleChildren = getVisibleChildren(route)
  return visibleChildren.length === 1
}

// 解析子路由路径（处理相对路径）
const resolveChildPath = (parentPath: string, childPath: string): string => {
  // 如果子路径已经是绝对路径，直接返回
  if (childPath.startsWith('/')) {
    return childPath
  }
  // 否则拼接父路径和子路径
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/').replace(/\/$/, '')
}

// 获取菜单路由（排除登录、注册、404等不需要在菜单中显示的路由）
const menuRoutes = computed(() => {
  const routes = router.getRoutes()

  // 过滤出需要在侧边栏显示的路由
  return routes
    .filter(r => {
      // 需要认证且未被隐藏且不是根路径且不是动态路由参数
      return r.meta?.requiresAuth &&
             !r.meta?.hidden &&
             r.path !== '/' &&
             !r.path.includes(':') &&
             r.parent === undefined
    })
    .sort((a, b) => {
      // 按照 meta 中的排序字段或路径排序
      const orderA = (a.meta?.order as number) || 0
      const orderB = (b.meta?.order as number) || 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.path.localeCompare(b.path)
    })
})

// 获取图标组件
const getIconComponent = (iconName: string): Component => {
  const icon = (ElementPlusIconsVue as Record<string, Component>)[iconName]
  return icon || ElementPlusIconsVue.Menu
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  width: 250px;
  height: calc(100vh - 60px);
  background: #ffffff;
  border-right: 1px solid #e6e0e9;
  transition: width 0.3s ease;
  z-index: 999;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-scrollbar {
  height: 100%;
}

.sidebar-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

/* 菜单项样式优化 */
.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #f5f0ff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #f0ebff;
  color: #6750a4;
  font-weight: 600;
}

/* 子菜单样式 */
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #f5f0ff;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background-color: #f0ebff;
  color: #6750a4;
}

/* 收起状态下的样式调整 */
.sidebar.collapsed .sidebar-menu :deep(.el-menu-item),
.sidebar.collapsed .sidebar-menu :deep(.el-sub-menu__title) {
  margin: 4px 8px;
  padding-left: 18px !important;
}

/* 滚动条样式 */
.sidebar-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
}

.sidebar-scrollbar :deep(.el-scrollbar__thumb) {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.sidebar-scrollbar :deep(.el-scrollbar__thumb:hover) {
  background-color: #c0c4cc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }

  .sidebar.collapsed {
    width: 64px;
  }
}
</style>
