<template>
  <div class="user-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="query.username"
            placeholder="请输入用户名"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增用户</el-button>
      </div>

      <el-table v-loading="isLoading" :data="tableData" border stripe>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120">
          <template #default="{ row }">
            {{ row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="部门" min-width="120" align="center">
          <template #default="{ row }">
            {{ (row as any).departmentName || row.departmentId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createtime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="UserFilled" @click="handleAssignRole(row)">分配角色</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              :icon="row.status === 1 ? 'Lock' : 'Unlock'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="warning" :icon="Key" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSearch"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新增 / 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="5-16位非空白字符" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="5-16位非空白字符" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称（可选）" />
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-input-number v-model="form.departmentId" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色（可选）" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色对话框 -->
    <el-dialog v-model="assignVisible" title="分配角色" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="用户名">
          <span>{{ currentUser?.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="assignRoleIds" multiple placeholder="请选择角色（可多选）" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetVisible" title="重置密码" width="420px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="用户名">
          <span>{{ currentUser?.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="resetPassword" type="password" show-password placeholder="5-16位非空白字符" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleResetSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Key, Plus, Refresh, Search, UserFilled } from '@element-plus/icons-vue'
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getUserPage,
  getUserRoles,
  resetUserPwd,
  updateUser,
  updateUserStatus
} from '@/api/user'
import type { UserCreateParams } from '@/api/user'
import { getRoleList } from '@/api/role'
import type { Role, User } from '@/types/user'
import { playCorrect, playError } from '@/utils/sound'

const query = reactive<{ username?: string; status?: number; page: number; pageSize: number }>({
  username: undefined,
  status: undefined,
  page: 1,
  pageSize: 20
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const tableData = ref<User[]>([])
const total = ref(0)
const roleOptions = ref<Role[]>([])

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const assignVisible = ref(false)
const resetVisible = ref(false)
const currentUser = ref<User | null>(null)
const assignRoleIds = ref<number[]>([])
const resetPassword = ref('')

const formRef = ref<FormInstance>()
const form = reactive<UserCreateParams>({
  username: '',
  password: '',
  nickname: '',
  departmentId: 0,
  status: 1,
  roleIds: []
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '用户名格式不正确，应为5-16位非空白字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{5,16}$/, message: '密码格式不正确，应为5-16位非空白字符', trigger: 'blur' }
  ],
  nickname: [{ max: 64, message: '昵称不能超过 64 个字符', trigger: 'blur' }]
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getUserPage({ ...query })
    tableData.value = res.data.list
    total.value = Number(res.data.total)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  query.page = 1
  fetchData()
    .then(() => {
      if (tableData.value.length === 0) {
        playError()
      } else {
        playCorrect()
      }
    })
    .catch(() => {
      playError()
    })
}

const handleReset = () => {
  query.username = undefined
  query.status = undefined
  query.page = 1
  fetchData()
}

const loadRoles = async () => {
  try {
    const res = await getRoleList()
    roleOptions.value = res.data
  } catch {
    roleOptions.value = []
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.departmentId = 0
  form.status = 1
  form.roleIds = []
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  isEdit.value = true
  currentUser.value = row
  form.username = row.username
  form.nickname = row.nickname || ''
  form.departmentId = row.departmentId ?? 0
  form.status = row.status ?? 1
  form.roleIds = []
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  isSubmitting.value = true
  try {
    if (isEdit.value) {
      await updateUser(currentUser.value!.id, {
        nickname: form.nickname,
        departmentId: form.departmentId,
        status: form.status
      })
      ElMessage.success('编辑成功')
    } else {
      await createUser(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleStatus = async (row: User) => {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '禁用'}用户「${row.username}」吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  await updateUserStatus(row.id, next)
  ElMessage.success(next === 1 ? '已启用' : '已禁用')
  fetchData()
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.username}」吗？此操作不可恢复。`, '警告', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

const handleAssignRole = async (row: User) => {
  currentUser.value = row
  assignRoleIds.value = []
  try {
    const res = await getUserRoles(row.id)
    assignRoleIds.value = (res.data || []).map((r) => r.id)
  } catch {
    // 忽略
  }
  assignVisible.value = true
}

const handleAssignSubmit = async () => {
  if (!currentUser.value) return
  isSubmitting.value = true
  try {
    await assignUserRoles(currentUser.value.id, assignRoleIds.value)
    ElMessage.success('分配成功')
    assignVisible.value = false
    fetchData()
  } finally {
    isSubmitting.value = false
  }
}

const handleResetPwd = (row: User) => {
  currentUser.value = row
  resetPassword.value = ''
  resetVisible.value = true
}

const handleResetSubmit = async () => {
  if (!currentUser.value) return
  if (!resetPassword.value || !/^\S{5,16}$/.test(resetPassword.value)) {
    ElMessage.error('密码格式不正确，应为5-16位非空白字符')
    return
  }
  isSubmitting.value = true
  try {
    await resetUserPwd(currentUser.value.id, resetPassword.value)
    ElMessage.success('重置成功')
    resetVisible.value = false
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
  loadRoles()
})
</script>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  margin-bottom: 12px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
