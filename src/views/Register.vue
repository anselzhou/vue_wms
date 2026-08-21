<template>
  <div class="register-container">
    <!-- 动态背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-orb bg-orb--1"></div>
      <div class="bg-orb bg-orb--2"></div>
      <div class="bg-orb bg-orb--3"></div>
      <div class="bg-grid"></div>
    </div>

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

/* 注册卡片 - 玻璃拟态 */
.register-card {
  background: color-mix(in srgb, var(--wms-surface) 82%, transparent);
  border-radius: var(--wms-radius-lg);
  border: 1px solid color-mix(in srgb, var(--wms-on-primary) 22%, transparent);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
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

/* 注册按钮 - 渐变悬浮效果 */
.register-button {
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

.register-button:hover {
  background: linear-gradient(135deg, var(--wms-primary-hover) 0%, var(--wms-primary) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--wms-primary) 40%, transparent);
}

.register-button:active {
  transform: translateY(0);
  background: var(--wms-primary-active);
}

.register-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wms-primary) 25%, transparent);
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
  color: color-mix(in srgb, var(--wms-on-primary) 80%, transparent);
  font-size: 14px;
  margin-top: 24px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
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
  .bg-orb {
    animation: none;
  }

  .brand-icon {
    animation: none;
  }

  .register-card-wrapper {
    animation: none;
  }
}
</style>
