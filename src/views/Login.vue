<template>
  <div class="login-container">
    <div class="login-card-wrapper">
      <!-- Logo 和品牌信息 -->
      <div class="brand-section">
        <el-icon class="brand-icon" :size="64">
          <Box />
        </el-icon>
        <h1 class="brand-title">WMS</h1>
        <p class="brand-subtitle">仓库管理系统</p>
      </div>

      <!-- 登录卡片 -->
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="card-header">
            <span class="card-title">欢迎登录</span>
          </div>
        </template>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
          @keyup.enter="handleLogin"
        >
          <!-- 用户名输入框 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入邮箱或用户名"
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
              placeholder="请输入密码"
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
              <el-checkbox v-model="loginForm.rememberMe" label="记住我" />
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="isLoading"
              @click="handleLogin"
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
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide, Box } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const isLoading = ref(false)
const showPassword = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const loginRules = reactive<FormRules<LoginForm>>({
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    isLoading.value = true

    // TODO: 实际的登录 API 调用
    // const response = await loginApi(loginForm)

    // 模拟登录成功 - 设置 token
    const mockToken = 'mock-token-' + Date.now()
    localStorage.setItem('token', mockToken)

    // 模拟用户信息
    localStorage.setItem('userInfo', JSON.stringify({
      username: loginForm.username,
      id: 'user-' + Date.now()
    }))

    console.log('登录信息:', { ...loginForm, password: '***' })

    ElMessage.success('登录成功')

    // 登录成功后跳转到首页
    await router.push('/dashboard')

    // 如果不选择"记住我"，则清除密码
    if (!loginForm.rememberMe) {
      loginForm.password = ''
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message || '登录失败，请检查用户名和密码')
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Material Design 3 颜色系统 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6750a4 0%, #958da5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card-wrapper {
  width: 100%;
  max-width: 440px;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.brand-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 16px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/* 登录卡片 - Material Design 3 风格 */
.login-card {
  background: #fffbfe;
  border-radius: 28px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.login-card :deep(.el-card__header) {
  padding: 32px 32px 16px;
  background: transparent;
  border-bottom: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1b20;
}

.login-card :deep(.el-card__body) {
  padding: 24px 32px 32px;
}

/* 表单样式 */
.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: none;
  border: 1px solid #e6e0e9;
  transition: all 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #79747e;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #6750a4;
  box-shadow: 0 0 0 2px rgba(103, 80, 164, 0.1);
}

.login-form :deep(.el-input__inner) {
  font-size: 16px;
  color: #1d1b20;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #79747e;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.form-options :deep(.el-checkbox__label) {
  color: #49454f;
  font-size: 14px;
}

.form-options :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #6750a4;
  border-color: #6750a4;
}

/* 登录按钮 - Material Design 3 风格 */
.login-button {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: #6750a4;
  border: none;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: #7f67be;
  box-shadow: 0 4px 12px rgba(103, 80, 164, 0.3);
}

.login-button:active {
  background: #625b71;
}

.login-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(103, 80, 164, 0.2);
}

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e6e0e9;
}

.text-secondary {
  color: #49454f;
  font-size: 14px;
}

.primary-link {
  color: #6750a4;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  margin-left: 8px;
  transition: color 0.2s ease;
}

.primary-link:hover {
  color: #7f67be;
}

/* 版权信息 */
.copyright {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 24px;
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
    padding: 24px 24px 16px;
  }

  .login-card :deep(.el-card__body) {
    padding: 16px 24px 24px;
  }

  .card-title {
    font-size: 20px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: #1c1b1f;
  }

  .card-title {
    color: #e6e1e5;
  }

  .login-form :deep(.el-input__wrapper) {
    border-color: #49454f;
    background: #2b2930;
  }

  .login-form :deep(.el-input__inner) {
    color: #e6e1e5;
  }

  .text-secondary {
    color: #cac4d0;
  }

  .register-link {
    border-top-color: #49454f;
  }

  .form-options :deep(.el-checkbox__label) {
    color: #cac4d0;
  }
}
</style>
