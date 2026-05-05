<template>
  <div class="register-container">
    <div class="register-card-wrapper">
      <!-- Logo 和品牌信息 -->
      <div class="brand-section">
        <el-icon class="brand-icon" :size="64">
          <Box />
        </el-icon>
        <h1 class="brand-title">WMS</h1>
        <p class="brand-subtitle">仓库管理系统</p>
      </div>

      <!-- 注册卡片 -->
      <el-card class="register-card" shadow="always">
        <template #header>
          <div class="card-header">
            <span class="card-title">创建账号</span>
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

          <!-- 邮箱输入框 -->
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              clearable
              autocomplete="email"
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
import { User, Lock, View, Hide, Box, Message } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface RegisterForm {
  username: string
  email: string
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
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 自定义验证器：确认密码
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
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
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含中文、字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agreeTerms: [
    {
      validator: (rule: any, value: boolean, callback: any) => {
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

    // TODO: 实际的注册 API 调用
    // const response = await registerApi(registerForm)

    // 模拟注册成功
    console.log('注册信息:', { ...registerForm, password: '***', confirmPassword: '***' })

    ElMessage.success('注册成功，请登录')

    // 注册成功后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message || '注册失败，请稍后重试')
    } else {
      ElMessage.error('注册失败，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Material Design 3 颜色系统 */
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6750a4 0%, #958da5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.register-card-wrapper {
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

/* 注册卡片 - Material Design 3 风格 */
.register-card {
  background: #fffbfe;
  border-radius: 28px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.register-card :deep(.el-card__header) {
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

.register-card :deep(.el-card__body) {
  padding: 24px 32px 32px;
}

/* 表单样式 */
.register-form {
  margin-top: 8px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: none;
  border: 1px solid #e6e0e9;
  transition: all 0.2s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: #79747e;
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #6750a4;
  box-shadow: 0 0 0 2px rgba(103, 80, 164, 0.1);
}

.register-form :deep(.el-input__inner) {
  font-size: 16px;
  color: #1d1b20;
}

.register-form :deep(.el-input__inner::placeholder) {
  color: #79747e;
}

/* 复选框样式 */
.register-form :deep(.el-checkbox__label) {
  color: #49454f;
  font-size: 14px;
}

.register-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #6750a4;
  border-color: #6750a4;
}

/* 注册按钮 - Material Design 3 风格 */
.register-button {
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

.register-button:hover {
  background: #7f67be;
  box-shadow: 0 4px 12px rgba(103, 80, 164, 0.3);
}

.register-button:active {
  background: #625b71;
}

.register-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(103, 80, 164, 0.2);
}

/* 登录链接 */
.login-link {
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
    padding: 24px 24px 16px;
  }

  .register-card :deep(.el-card__body) {
    padding: 16px 24px 24px;
  }

  .card-title {
    font-size: 20px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .register-card {
    background: #1c1b1f;
  }

  .card-title {
    color: #e6e1e5;
  }

  .register-form :deep(.el-input__wrapper) {
    border-color: #49454f;
    background: #2b2930;
  }

  .register-form :deep(.el-input__inner) {
    color: #e6e1e5;
  }

  .text-secondary {
    color: #cac4d0;
  }

  .login-link {
    border-top-color: #49454f;
  }

  .register-form :deep(.el-checkbox__label) {
    color: #cac4d0;
  }
}
</style>
