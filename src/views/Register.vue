<template>
  <div class="register-container">
    <!-- 中国风水墨山水背景 -->
    <ChineseLandscapeBackground />

    <div class="register-card-wrapper">
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

      <!-- 注册卡片（玻璃拟态） -->
      <el-card class="register-card" shadow="always">
        <template #header>
          <div class="card-header">
            <span class="card-title">创建账号</span>
            <p class="card-desc">注册一个新账号开始使用系统</p>
          </div>
        </template>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
          @submit.prevent="handleRegister"
        >
          <!-- 用户名输入框 -->
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请设置密码（6-20位）"
              size="large"
              :prefix-icon="Lock"
              autocomplete="new-password"
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

          <!-- 确认密码输入框 -->
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              size="large"
              :prefix-icon="Lock"
              autocomplete="new-password"
            >
              <template #suffix>
                <el-icon
                  class="cursor-pointer hover:text-primary"
                  @click="toggleConfirmPasswordVisibility"
                >
                  <View v-if="!showConfirmPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 同意条款 -->
          <el-form-item prop="agreeTerms">
            <el-checkbox v-model="registerForm.agreeTerms">
              我已阅读并同意
              <el-link type="primary" :underline="false">用户协议</el-link>
              和
              <el-link type="primary" :underline="false">隐私政策</el-link>
            </el-checkbox>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-button"
              :loading="isLoading"
              @click="handleRegister"
            >
              {{ isLoading ? '注册中...' : '立即注册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 登录链接 -->
        <div class="login-link">
          <span class="text-secondary">已有账号？</span>
          <RouterLink to="/login" class="primary-link">
            立即登录 →
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
import { register } from '@/api/user'
import ChineseLandscapeBackground from '@/components/ChineseLandscapeBackground.vue'

interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

const router = useRouter()
const registerFormRef = ref<FormInstance>()
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const registerForm = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 自定义验证器：确认密码
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules = reactive<FormRules<RegisterForm>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 5, max: 16, message: '用户名长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '用户名不能包含空格', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '密码不能包含空格', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agreeTerms: [
    {
      validator: (_rule: any, value: boolean, callback: any) => {
        if (!value) {
          callback(new Error('请阅读并同意用户协议和隐私政策'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()

    isLoading.value = true

    await register({
      username: registerForm.username,
      password: registerForm.password
    })

    ElMessage.success('注册成功，请登录')

    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    console.error('注册失败:', error)
    // 不在这里显示错误，因为 request.ts 拦截器已经显示了
    // 避免重复显示错误信息
  } finally {
    isLoading.value = false
  }
}

</script>

<style scoped>
.register-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f2f0e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.register-card-wrapper {
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

/* 注册卡片 - 宣纸质感 */
.register-card {
  background: rgba(252, 249, 241, 0.92);
  border-radius: 14px;
  border: 1px solid rgba(120, 115, 100, 0.28);
  box-shadow: 0 24px 56px rgba(40, 45, 40, 0.28);
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

.register-card :deep(.el-card__header) {
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

.register-card :deep(.el-card__body) {
  padding: 24px 36px 36px;
}

/* 表单样式 */
.register-form {
  margin-top: 8px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  border-radius: var(--wms-radius);
  padding: 8px 14px;
  box-shadow: none;
  border: 1px solid var(--wms-border);
  background-color: color-mix(in srgb, var(--wms-surface) 70%, transparent);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: var(--wms-primary-soft);
  background-color: var(--wms-surface);
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--wms-primary);
  background-color: var(--wms-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wms-primary) 16%, transparent);
}

.register-form :deep(.el-input__wrapper.is-error) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger, #f56c6c) 14%, transparent);
}

.register-form :deep(.el-input__inner) {
  font-size: 16px;
  color: var(--wms-text);
}

.register-form :deep(.el-input__inner::placeholder) {
  color: var(--wms-text-muted);
}

.register-form :deep(.el-input__prefix) {
  color: var(--wms-text-muted);
}

/* 复选框样式 */
.register-form :deep(.el-checkbox__label) {
  color: var(--wms-text-secondary);
  font-size: 14px;
}

.register-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--wms-primary);
  border-color: var(--wms-primary);
}

/* 注册按钮 - 水墨朱砂渐变 */
.register-button {
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

.register-button:hover {
  background: linear-gradient(135deg, #8f241e 0%, #bd3d2c 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(120, 40, 30, 0.4);
}

.register-button:active {
  transform: translateY(0);
  background: #6d1b16;
}

.register-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(168, 50, 40, 0.28);
}

/* 登录链接 */
.login-link {
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
  .register-container {
    padding: 16px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .register-card :deep(.el-card__header) {
    padding: 28px 24px 12px;
  }

  .register-card :deep(.el-card__body) {
    padding: 16px 24px 28px;
  }

  .card-title {
    font-size: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-icon {
    animation: none;
  }

  .register-card-wrapper {
    animation: none;
  }
}
</style>
