<script setup lang="ts">
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { ElMessage } from 'element-plus'
import { Brush, Check } from '@element-plus/icons-vue'

const { theme, themeOptions, setTheme } = useTheme()

const handleSelect = (name: ThemeName) => {
  if (name === theme.value) return
  setTheme(name)
  const label = themeOptions.find((t) => t.name === name)?.label ?? name
  ElMessage.success(`已切换为「${label}」主题`)
}
</script>

<template>
  <div class="settings-page">
    <h1 class="page-title">设置</h1>

    <el-card shadow="never" class="settings-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18"><Brush /></el-icon>
          <span>主题风格</span>
        </div>
      </template>

      <p class="section-desc">选择系统外观，也可通过顶部导航栏主题下拉菜单切换。</p>

      <div class="theme-grid">
        <button
          v-for="opt in themeOptions"
          :key="opt.name"
          type="button"
          class="theme-card"
          :class="{ active: theme === opt.name }"
          @click="handleSelect(opt.name)"
        >
          <div class="theme-preview" :style="{ background: opt.swatch }">
            <span v-if="theme === opt.name" class="check">
              <el-icon :size="16"><Check /></el-icon>
            </span>
          </div>
          <div class="theme-meta">
            <strong>{{ opt.label }}</strong>
            <span>{{ opt.description }}</span>
          </div>
        </button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 720px;
}

.page-title {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 700;
  color: var(--wms-text);
}

.settings-card {
  border: 1px solid var(--wms-border);
  border-radius: var(--wms-radius);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--wms-text);
}

.section-desc {
  margin: 0 0 20px;
  color: var(--wms-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--wms-border);
  border-radius: var(--wms-radius);
  background: var(--wms-surface);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.theme-card:hover {
  border-color: var(--wms-primary-soft);
}

.theme-card.active {
  border-color: var(--wms-primary);
  box-shadow: 0 0 0 1px var(--wms-primary);
}

.theme-preview {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wms-on-primary);
  background: rgba(0, 0, 0, 0.2);
  border-radius: inherit;
}

.theme-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.theme-meta strong {
  color: var(--wms-text);
  font-size: 15px;
}

.theme-meta span {
  color: var(--wms-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}
</style>
