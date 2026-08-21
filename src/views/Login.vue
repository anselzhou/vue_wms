<template>
  <div class="login-container">
    <!-- 动态背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-orb bg-orb--1"></div>
      <div class="bg-orb bg-orb--2"></div>
      <div class="bg-orb bg-orb--3"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="login-card-wrapper">
      <!-- Logo 和品牌信息 -->
      <div class="brand-section">
        <div class="brand-logo">
          <el-icon class="brand-icon" :size="40">
            <Box />
          </el-icon>
        </div>
        <h1 class="brand-title">WMS</h1>
        <p class="brand-subtitle">仓库管理系统</p>
      </div>

      <!-- 登录卡片（玻璃拟态） -->
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="card-header">
            <span class="card-title">欢迎登录</span>
            <p class="card-desc">请使用您的账号登录系统</p>
          </div>
        </template>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          status-icon
          scroll-to-error
          inline-message
          hide-required-asterisk
          aria-label="登录表单"
          @submit.prevent="handleLogin"
        >
          <!-- 用户名输入框 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名（5-16位）"
              size="large"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（5-16位）"
              size="large"
              :prefix-icon="Lock"
              autocomplete="current-password"
            >
              <template #suffix>
                <el-icon
                  class="cursor-pointer hover:text-primary"
                  @click="togglePasswordVisibility"
                >
                  <View v-if="!showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 记住我和忘记密码 -->
          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="loginForm.rememberMe" label="记住用户名" />
              <el-link type="primary" underline="hover" @click="handleForgotPassword">忘记密码？</el-link>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="isLoading"
              native-type="submit"
            >
              {{ isLoading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 注册链接 -->
        <div class="register-link">
          <span class="text-secondary">还没有账号？</span>
          <RouterLink to="/register" class="primary-link">
            立即注册 →
          </RouterLink>
        </div>
      </el-card>

      <!-- 版权信息 -->
      <p class="copyright">© 2026 WMS - Vue3 All Rights Reserved</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, View, Hide, Box } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { login, getUserInfo } from '@/api/user'

interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

const router = useRouter()
const route = useRoute()
const loginFormRef = ref<FormInstance>()
const isLoading = ref(false)
const showPassword = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  rememberMe: false
})

const loginRules = reactive<FormRules<LoginForm>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 5, max: 16, message: '用户名长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '用户名不能包含空格', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '密码不能包含空格', trigger: 'blur' }
  ]
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  // Step 1: Validate form fields first — keep this separate from API errors
  // so validation failures don't show a misleading "登录失败" message.
  try {
    await loginFormRef.value.validate()
  } catch {
    // Element Plus form validation already displays per-field error messages;
    // no additional toast is needed.
    return
  }

  isLoading.value = true
  try {
    const response = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (!response.data?.token) {
      ElMessage.error('登录失败，服务器未返回token')
      return
    }

    const token: string = response.data.token
    localStorage.setItem('token', token)

    try {
      const userInfoResponse = await getUserInfo()
      if (userInfoResponse.data) {
        localStorage.setItem('userInfo', JSON.stringify(userInfoResponse.data))
      }
    } catch {
      // If userInfo fetch fails, roll back the token so the user
      // isn't left in a half-authenticated state.
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.error('获取用户信息失败，请重新登录')
      return
    }

    if (loginForm.rememberMe) {
      localStorage.setItem('rememberMe', 'true')
      localStorage.setItem('savedUsername', loginForm.username)
    } else {
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('savedUsername')
    }

    ElMessage.success('登录成功')

    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.push(redirect)
  } catch (error: any) {
    // Only API / network errors reach this block now.
    // Status-specific messages (e.g. 401) are already shown by the
    // Axios response interceptor, so we only show a generic fallback.
    const httpStatus = error?.response?.status
    if (!httpStatus) {
      // Network error or timeout — interceptor already shows a message,
      // but we add context here.
      if (error?.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请检查网络连接')
      } else if (!error?.response) {
        ElMessage.error('网络错误，请检查网络连接')
      } else {
        ElMessage.error('登录失败，请检查用户名和密码')
      }
    }
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员重置密码')
}

const loadSavedCredentials = () => {
  const rememberMe = localStorage.getItem('rememberMe')
  const savedUsername = localStorage.getItem('savedUsername')

  if (rememberMe === 'true' && savedUsername) {
    loginForm.username = savedUsername
    loginForm.rememberMe = true
  }
}

loadSavedCredentials()
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, color-mix(in srgb, var(--wms-logo-from) 35%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 20%, color-mix(in srgb, var(--wms-logo-to) 30%, transparent) 0%, transparent 55%),
    linear-gradient(135deg, var(--wms-logo-from) 0%, color-mix(in srgb, var(--wms-logo-from) 70%, var(--wms-logo-to) 30%) 50%, var(--wms-logo-to) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ===== 动态背景装饰 ===== */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  will-change: transform;
  animation: orb-float 14s ease-in-out infinite;
}

.bg-orb--1 {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: color-mix(in srgb, var(--wms-on-primary) 40%, transparent);
}

.bg-orb--2 {
  width: 360px;
  height: 360px;
  bottom: -100px;
  right: -60px;
  background: color-mix(in srgb, var(--wms-primary) 60%, transparent);
  animation-delay: -4s;
}

.bg-orb--3 {
  width: 280px;
  height: 280px;
  top: 40%;
  right: 12%;
  background: color-mix(in srgb, var(--wms-on-primary) 25%, transparent);
  animation-delay: -8s;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--wms-on-primary) 8%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--wms-on-primary) 8%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 90% 70% at 50% 40%, rgba(0, 0, 0, 0.9) 0%, transparent 75%);
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -25px) scale(1.08); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.login-card-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  animation: wrapper-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes wrapper-in {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
  color: var(--wms-on-primary);
}

.brand-logo {
  display: inline-flex;
  margin-bottom: 16px;
}

.brand-icon {
  background: color-mix(in srgb, var(--wms-on-primary) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--wms-on-primary) 30%, transparent);
  border-radius: 20px;
  padding: 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  animation: logo-glow 3s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }
  50% { box-shadow: 0 8px 40px color-mix(in srgb, var(--wms-on-primary) 30%, transparent); }
}

.brand-title {
  font-size: 34px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.92;
  margin: 0;
  letter-spacing: 2px;
}

/* 登录卡片 - 玻璃拟态 */
.login-card {
  background: color-mix(in srgb, var(--wms-surface) 82%, transparent);
  border-radius: var(--wms-radius-lg);
  border: 1px solid color-mix(in srgb, var(--wms-on-primary) 22%, transparent);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

.login-card :deep(.el-card__header) {
  padding: 36px 36px 16px;
  background: transparent;
  border-bottom: none;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--wms-text);
}

.card-desc {
  margin: 0;
  font-size: 14px;
  color: var(--wms-text-muted);
}

.login-card :deep(.el-card__body) {
  padding: 24px 36px 36px;
}

/* 表单样式 */
.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: var(--wms-radius);
  padding: 8px 14px;
  box-shadow: none;
  border: 1px solid var(--wms-border);
  background-color: color-mix(in srgb, var(--wms-surface) 70%, transparent);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--wms-primary-soft);
  background-color: var(--wms-surface);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--wms-primary);
  background-color: var(--wms-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wms-primary) 16%, transparent);
}

.login-form :deep(.el-input__wrapper.is-error) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger, #f56c6c) 14%, transparent);
}

.login-form :deep(.el-input__inner) {
  font-size: 16px;
  color: var(--wms-text);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--wms-text-muted);
}

.login-form :deep(.el-input__prefix) {
  color: var(--wms-text-muted);
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.form-options :deep(.el-checkbox__label) {
  color: var(--wms-text-secondary);
  font-size: 14px;
}

.form-options :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--wms-primary);
  border-color: var(--wms-primary);
}

.form-options :deep(.el-link) {
  font-size: 14px;
  font-weight: 500;
}

/* 登录按钮 - 渐变悬浮效果 */
.login-button {
  width: 100%;
  height: 56px;
  border-radius: var(--wms-radius);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border: none;
  background: linear-gradient(135deg, var(--wms-primary) 0%, color-mix(in srgb, var(--wms-primary-hover) 60%, var(--wms-primary)) 100%);
  transition: all 0.25s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, var(--wms-primary-hover) 0%, var(--wms-primary) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--wms-primary) 40%, transparent);
}

.login-button:active {
  transform: translateY(0);
  background: var(--wms-primary-active);
}

.login-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wms-primary) 25%, transparent);
}

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--wms-border);
}

.text-secondary {
  color: var(--wms-text-secondary);
  font-size: 14px;
}

.primary-link {
  color: var(--wms-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  margin-left: 8px;
  transition: color 0.2s ease;
}

.primary-link:hover {
  color: var(--wms-primary-hover);
}

/* 版权信息 */
.copyright {
  text-align: center;
  color: color-mix(in srgb, var(--wms-on-primary) 80%, transparent);
  font-size: 14px;
  margin-top: 24px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .login-card :deep(.el-card__header) {
    padding: 28px 24px 12px;
  }

  .login-card :deep(.el-card__body) {
    padding: 16px 24px 28px;
  }

  .card-title {
    font-size: 22px;
  }
}

/* 浅色下降低饱和装饰，避免干扰可读性 */
@media (prefers-reduced-motion: reduce) {
  .bg-orb {
    animation: none;
  }

  .brand-icon {
    animation: none;
  }

  .login-card-wrapper {
    animation: none;
  }
}
</style>
