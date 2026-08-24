<template>
  <div class="forbidden-page" :class="{ 'forbidden-page--embedded': embedded }">
    <!-- 装饰背景（嵌入模式时不显示，避免与 Layout 背景冲突） -->
    <div v-if="!embedded" class="bg-decoration" aria-hidden="true">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 主卡片 -->
    <div class="forbidden-card">
      <!-- 错误码动画 -->
      <div class="error-code" aria-hidden="true">
        <span
          v-for="(digit, index) in '403'"
          :key="index"
          class="digit"
          :style="{ animationDelay: `${index * 0.12}s` }"
        >{{ digit }}</span>
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 文字说明 -->
      <h2 class="error-title">抱歉，您没有访问权限</h2>
      <p class="error-description">
        当前账号没有访问该页面的权限，请联系管理员为您授权
      </p>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" round @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          <span>返回首页</span>
        </el-button>
        <el-button
          size="large"
          round
          :disabled="!canGoBack"
          @click="goBack"
        >
          <el-icon><ArrowLeft /></el-icon>
          <span>返回上页</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

/**
 * 当嵌入 Layout 内部（Forbidden）时，
 * 组件只撑满内容区域，不占据全视口。
 */
defineProps<{
  embedded?: boolean
}>()

const router = useRouter()

/** 浏览器历史中是否有可返回的页面（同源） */
const canGoBack = computed(() => {
  try {
    return window.history.length > 1
  } catch {
    return false
  }
})

function goHome() {
  router.replace('/dashboard')
}

function goBack() {
  if (canGoBack.value) {
    router.back()
  }
}
</script>

<style scoped>
/* ========== 页面容器 ========== */
.forbidden-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--wms-page-bg);
  overflow: hidden;
}

/* 嵌入 Layout 时：撑满父容器，用 calc 减去 Layout 的 nav + padding */
.forbidden-page--embedded {
  min-height: calc(100vh - 60px - 40px); /* navbar 60px + main padding 40px */
  background: transparent;
}

/* ========== 装饰背景圆 ========== */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: var(--wms-primary);
}

.circle-1 {
  width: 500px;
  height: 500px;
  top: -120px;
  right: -100px;
  animation: float-a 12s ease-in-out infinite;
}

.circle-2 {
  width: 340px;
  height: 340px;
  bottom: -80px;
  left: -60px;
  animation: float-b 14s ease-in-out infinite;
  opacity: 0.06;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 4s ease-in-out infinite;
  opacity: 0.04;
}

@keyframes float-a {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-30px) rotate(8deg); }
}

@keyframes float-b {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(30px) rotate(-6deg); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50%      { transform: translate(-50%, -50%) scale(1.25); }
}

/* ========== 主卡片 ========== */
.forbidden-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 520px;
  width: 100%;
  padding: 48px 40px;
  border-radius: var(--wms-radius);
  background: var(--wms-surface);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.06);
  animation: card-in 0.6s ease-out both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 错误码 403 ========== */
.error-code {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.digit {
  display: inline-block;
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -4px;
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--wms-primary),
    var(--wms-primary-soft)
  );
  background-clip: text;
  -webkit-background-clip: text;
  animation: digit-in 0.5s ease-out both;
}

.digit:nth-child(1) { animation-name: digit-in-left; }
.digit:nth-child(2) { animation-name: digit-in-up; }
.digit:nth-child(3) { animation-name: digit-in-right; }

@keyframes digit-in-left {
  from { opacity: 0; transform: translateX(-30px) rotate(-8deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0deg); }
}

@keyframes digit-in-up {
  from { opacity: 0; transform: translateY(-30px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes digit-in-right {
  from { opacity: 0; transform: translateX(30px) rotate(8deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0deg); }
}

/* ========== 分割线 ========== */
.divider {
  width: 48px;
  height: 3px;
  margin: 20px 0 24px;
  border-radius: 2px;
  background: var(--wms-primary);
  opacity: 0.5;
  animation: divider-expand 0.5s 0.4s ease-out both;
}

@keyframes divider-expand {
  from { width: 0; opacity: 0; }
  to   { width: 48px; opacity: 0.5; }
}

/* ========== 错误文字 ========== */
.error-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--wms-text);
  margin: 0 0 12px;
  text-align: center;
}

.error-description {
  font-size: 14px;
  line-height: 1.7;
  color: var(--wms-text-secondary);
  margin: 0 0 32px;
  text-align: center;
}

/* ========== 操作按钮 ========== */
.action-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
