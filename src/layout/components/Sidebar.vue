<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :router="true"
        mode="vertical"
        :collapse="isCollapsed"
        :unique-opened="true"
        :collapse-transition="false"
        class="sidebar-menu"
      >
        <template v-for="item in menuRoutes" :key="item.path">
          <el-sub-menu
            v-if="shouldShowSubMenu(item)"
            :index="item.path"
          >
            <template #title>
              <el-icon v-if="item.meta?.icon">
                <component :is="getIconComponent(item.meta.icon)" />
              </el-icon>
              <span>{{ item.meta?.title }}</span>
            </template>

            <el-menu-item
              v-for="child in getVisibleChildren(item)"
              :key="child.path"
              :index="resolveChildPath(item.path, child.path)"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="getIconComponent(child.meta.icon)" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item
            v-else-if="hasSingleVisibleChild(item)"
            :index="resolveChildPath(item.path, getVisibleChildren(item)[0].path)"
          >
            <el-icon v-if="item.meta?.icon || getVisibleChildren(item)[0].meta?.icon">
              <component :is="getIconComponent((item.meta?.icon || getVisibleChildren(item)[0].meta?.icon)!)" />
            </el-icon>
            <template #title>{{ item.meta?.title }}</template>
          </el-menu-item>

          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.meta?.icon">
              <component :is="getIconComponent(item.meta.icon)" />
            </el-icon>
            <template #title>{{ item.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@/router/routes'
import { hasPermission } from '@/utils/permission'

interface Props {
  isCollapsed: boolean
}

defineProps<Props>()

const route = useRoute()

const activeMenu = computed(() => route.path)

/**
 * 过滤有权限访问的可见子菜单：
 * - 隐藏路由（meta.hidden）不显示
 * - meta.perms 配置了权限编码的，需当前用户拥有其中任一编码
 * - 未配置 perms 的菜单默认可见
 */
const getVisibleChildren = (r: RouteRecordRaw): RouteRecordRaw[] =>
  (r.children ?? []).filter((child) => !child.meta?.hidden && hasPermission(child.meta?.perms))

const shouldShowSubMenu = (r: RouteRecordRaw): boolean =>
  getVisibleChildren(r).length > 1

const hasSingleVisibleChild = (r: RouteRecordRaw): boolean =>
  getVisibleChildren(r).length === 1

const toAbsolutePath = (path: string): string =>
  path.startsWith('/') ? path : `/${path}`

const resolveChildPath = (parentPath: string, childPath: string): string => {
  if (childPath.startsWith('/')) return childPath
  return `${toAbsolutePath(parentPath)}/${childPath}`.replace(/\/+/g, '/')
}

/**
 * 侧边栏菜单：取 Layout 下未隐藏、且当前用户有权限的子路由，并规范为绝对 path。
 * 过滤规则：
 * - 隐藏路由（meta.hidden）不显示
 * - 一级路由自身未配置 perms，或已拥有其中任一权限编码
 * - 一级路由是父级菜单（有 children）时，仅当存在至少一个可见且有权限的子菜单才显示
 */
const menuRoutes = computed(() => {
  const layoutRoute = constantRoutes.find((r) => r.path === '/' && r.children)
  return (layoutRoute?.children ?? [])
    .filter((r) => !r.meta?.hidden)
    .filter((r) => {
      if (!hasPermission(r.meta?.perms)) return false
      if (r.children?.length) return getVisibleChildren(r).length > 0
      return true
    })
    .map((r) => ({ ...r, path: toAbsolutePath(r.path) }))
})

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
  background: var(--wms-surface);
  border-right: 1px solid var(--wms-border);
  transition: width 0.3s ease, background-color 0.25s ease, border-color 0.25s ease;
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
  /* 提取侧边栏菜单项公共尺寸变量，便于统一调整 */
  --sidebar-item-height: 48px;
  --sidebar-item-margin: 4px 8px;

  border-right: none;
  height: 100%;
  background: transparent !important;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--wms-text-secondary);
  --el-menu-active-color: var(--wms-primary);
  --el-menu-hover-bg-color: var(--wms-primary-bg);
}

/*
  将 .el-menu-item 与 .el-sub-menu__title 的公共样式合并，
  避免重复声明 height / margin / border-radius / transition。

  使用 flex + align-items 代替 line-height 实现垂直居中：
  - 避免多行文本时 line-height 失效导致的溢出问题
  - 与 Element Plus 内部 flex 布局保持一致
*/
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
  height: var(--sidebar-item-height);
  margin: var(--sidebar-item-margin);
  border-radius: var(--wms-radius);
  /* 仅指定实际变化的属性，避免 transition: all 触发不必要的重绘 */
  transition: background-color 0.2s ease, color 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--wms-primary-bg);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--wms-primary-bg-active);
  color: var(--wms-primary);
  font-weight: 600;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background-color: var(--wms-primary-bg-active);
  color: var(--wms-primary);
}

/*
  折叠状态下仍需保留水平内边距与 margin，
  使用 CSS 变量继承父级 margin 值，避免硬编码重复。
  padding-left 使用 calc 使图标在折叠态居中：
  (折叠宽度 64px - Element Plus 默认图标 24px) / 2 ≈ 20px，
  但 Element Plus collapse 模式会自动叠加 padding，故用 !important 覆盖。
*/
.sidebar.collapsed .sidebar-menu :deep(.el-menu-item),
.sidebar.collapsed .sidebar-menu :deep(.el-sub-menu__title) {
  margin: var(--sidebar-item-margin);
  padding-left: 18px !important;
}

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
