<template>
  <div class="password-container">
    <el-card class="password-card" shadow="always">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" class="header-icon"><Lock /></el-icon>
          <span class="card-title">修改密码</span>
        </div>
      </template>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        class="password-form"
        status-icon
        scroll-to-error
        inline-message
        hide-required-asterisk
        @submit.prevent="handleSubmit"
      >
        <!-- 原密码 -->
        <el-form-item prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            :type="showOldPwd ? 'text' : 'password'"
            placeholder="请输入原密码"
            size="large"
            :prefix-icon="Lock"
            autocomplete="new-password"
            clearable
          >
            <template #suffix>
              <el-icon
                class="cursor-pointer hover:text-primary"
                @click="showOldPwd = !showOldPwd"
              >
                <View v-if="!showOldPwd" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 新密码 -->
        <el-form-item prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            :type="showNewPwd ? 'text' : 'password'"
            placeholder="请输入新密码（5-16位）"
            size="large"
            :prefix-icon="Lock"
            autocomplete="new-password"
            clearable
          >
            <template #suffix>
              <el-icon
                class="cursor-pointer hover:text-primary"
                @click="showNewPwd = !showNewPwd"
              >
                <View v-if="!showNewPwd" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认新密码 -->
        <el-form-item prop="rePassword">
          <el-input
            v-model="passwordForm.rePassword"
            :type="showRePwd ? 'text' : 'password'"
            placeholder="请再次输入新密码"
            size="large"
            :prefix-icon="Lock"
            autocomplete="new-password"
            clearable
          >
            <template #suffix>
              <el-icon
                class="cursor-pointer hover:text-primary"
                @click="showRePwd = !showRePwd"
              >
                <View v-if="!showRePwd" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-button"
            :loading="isSubmitting"
            native-type="submit"
          >
            {{ isSubmitting ? '提交中...' : '确认修改' }}
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, View, Hide } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { updatePwd } from '@/api/user'

interface PasswordForm {
  oldPassword: string
  newPassword: string
  rePassword: string
}

const router = useRouter()
const passwordFormRef = ref<FormInstance>()
const isSubmitting = ref(false)
const showOldPwd = ref(false)
const showNewPwd = ref(false)
const showRePwd = ref(false)

const passwordForm = reactive<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  rePassword: ''
})

const validateNewPwd = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (value === passwordForm.oldPassword) {
    callback(new Error('新密码不能与原密码相同'))
  } else {
    callback()
  }
}

const validateRePwd = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules<PasswordForm>>({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '密码不能包含空格', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '密码不能包含空格', trigger: 'blur' },
    { validator: validateNewPwd, trigger: 'blur' }
  ],
  rePassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateRePwd, trigger: 'blur' }
  ]
})

const handleSubmit = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  isSubmitting.value = true
  try {
    await updatePwd({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      rePassword: passwordForm.rePassword
    })

    ElMessage.success('密码修改成功，请重新登录')

    // 后端已使当前 token 失效，前端同步清理本地状态并跳转登录页
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    await router.push('/login')
  } catch {
    // 业务错误 / HTTP 错误 / 网络错误提示已由 Axios 响应拦截器统一处理，无需重复提示
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = () => {
  passwordFormRef.value?.resetFields()
}
</script>

<style scoped>
.password-container {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

.password-card {
  width: 100%;
  max-width: 460px;
  border-radius: var(--wms-radius, 8px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--wms-primary, #409eff);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--wms-text, #303133);
}

.password-form {
  padding: 8px 0;
}

.submit-button {
  width: 100%;
  margin-right: 8px;
}
</style>
