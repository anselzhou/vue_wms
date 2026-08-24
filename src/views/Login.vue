<template>
  <div class="login-container">
    <!-- 中国风水墨山水背景 -->
    <ChineseLandscapeBackground />

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
import ChineseLandscapeBackground from '@/components/ChineseLandscapeBackground.vue'

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
    // 业务错误（如密码错误）：拦截器已弹出具体提示（如「密码错误」），这里无需重复提示
    if (error?.isBusinessError) {
      return
    }

    // HTTP 状态错误（如 401/403）：拦截器已按状态码提示，这里无需重复提示
    if (error?.response?.status) {
      return
    }

    // 其余为网络/超时错误，补充上下文提示
    if (error?.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
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
  background: #f2f0e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
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

/* 品牌区域 - 水墨深色文字 */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
  color: #2b3531;
}

.brand-logo {
  display: inline-flex;
  margin-bottom: 16px;
}

.brand-icon {
  background: rgba(255, 252, 244, 0.75);
  border: 1px solid rgba(90, 100, 96, 0.35);
  border-radius: 20px;
  padding: 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  color: #2b3531;
  animation: logo-glow 3s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
  50% { box-shadow: 0 8px 40px rgba(140, 110, 70, 0.25); }
}

.brand-title {
  font-size: 34px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
  color: #22302b;
  text-shadow: 0 2px 12px rgba(255, 255, 255, 0.45);
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.92;
  margin: 0;
  letter-spacing: 3px;
  color: #4a564f;
}

/* 登录卡片 - 宣纸质感 */
.login-card {
  background: rgba(252, 249, 241, 0.92);
  border-radius: 14px;
  border: 1px solid rgba(120, 115, 100, 0.28);
  box-shadow: 0 24px 56px rgba(40, 45, 40, 0.28);
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

/* 登录按钮 - 水墨朱砂渐变 */
.login-button {
  width: 100%;
  height: 56px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border: none;
  color: #fdf9f0;
  background: linear-gradient(135deg, #7a1f1a 0%, #a83228 55%, #c24a33 100%);
  transition: all 0.25s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #8f241e 0%, #bd3d2c 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(120, 40, 30, 0.4);
}

.login-button:active {
  transform: translateY(0);
  background: #6d1b16;
}

.login-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(168, 50, 40, 0.28);
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
  color: rgba(43, 53, 49, 0.82);
  font-size: 14px;
  margin-top: 24px;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.4);
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
  .brand-icon {
    animation: none;
  }

  .login-card-wrapper {
    animation: none;
  }
}
</style>
