<template>
  <div class="role-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="角色编码 / 名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增角色</el-button>
      </div>

      <el-table v-loading="isLoading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="roleCode" label="角色编码" min-width="120" />
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="160">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="dataScope" label="数据范围" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="scopeTagType(row.dataScope)" size="small">
              {{ scopeLabel(row.dataScope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="Lock" @click="handleAssignPerm(row)">分配权限</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="isEdit" placeholder="如 WAREHOUSE" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="角色描述（可选）" />
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScope">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option label="全部数据" value="ALL" />
            <el-option label="本部门数据" value="DEPT" />
            <el-option label="仅本人数据" value="SELF" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog v-model="assignVisible" title="分配权限" width="520px" destroy-on-close>
      <div class="assign-tip">角色：{{ currentRole?.roleName }}（{{ currentRole?.roleCode }}）</div>
      <el-tree
        ref="treeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :props="{ label: 'permName', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { ElTree } from 'element-plus'
import { Delete, Edit, Lock, Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRolePage,
  getRolePermissionIds,
  updateRole,
  updateRoleStatus
} from '@/api/role'
import type { RoleParams } from '@/api/role'
import { getPermissionTree } from '@/api/permission'
import type { Permission } from '@/types/permission'
import type { Role } from '@/types/user'
import { playCorrect, playError } from '@/utils/sound'

const query = reactive<{ keyword?: string; page: number; pageSize: number }>({
  keyword: undefined,
  page: 1,
  pageSize: 20
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const tableData = ref<Role[]>([])
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const assignVisible = ref(false)
const currentRole = ref<Role | null>(null)

const permTree = ref<Permission[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

const formRef = ref<FormInstance>()
const form = reactive<RoleParams>({
  roleCode: '',
  roleName: '',
  description: '',
  dataScope: 'SELF',
  status: 1
})

const formRules: FormRules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]{1,31}$/, message: '角色编码应为 2-32 位大写字母、数字或下划线', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 64, message: '角色名称不能超过 64 个字符', trigger: 'blur' }
  ],
  dataScope: [{ required: true, message: '请选择数据范围', trigger: 'change' }]
}

const scopeLabel = (scope?: string) => {
  switch (scope) {
    case 'ALL': return '全部'
    case 'DEPT': return '本部门'
    case 'SELF': return '本人'
    default: return scope || '-'
  }
}

const scopeTagType = (scope?: string) => {
  switch (scope) {
    case 'ALL': return 'danger'
    case 'DEPT': return 'warning'
    case 'SELF': return 'info'
    default: return 'info'
  }
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getRolePage({ ...query })
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
  query.keyword = undefined
  query.page = 1
  fetchData()
}

const handleCreate = () => {
  isEdit.value = false
  form.roleCode = ''
  form.roleName = ''
  form.description = ''
  form.dataScope = 'SELF'
  form.status = 1
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  isEdit.value = true
  currentRole.value = row
  form.roleCode = row.roleCode
  form.roleName = row.roleName
  form.description = row.description || ''
  form.dataScope = row.dataScope || 'SELF'
  form.status = row.status ?? 1
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
      await updateRole(currentRole.value!.id, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createRole({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleStatus = async (row: Role) => {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '禁用'}角色「${row.roleName}」吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  await updateRoleStatus(row.id, next)
  ElMessage.success(next === 1 ? '已启用' : '已禁用')
  fetchData()
}

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色「${row.roleName}」吗？此操作不可恢复。`, '警告', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await deleteRole(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

const loadPermTree = async () => {
  try {
    const res = await getPermissionTree()
    permTree.value = res.data || []
  } catch {
    permTree.value = []
  }
}

const handleAssignPerm = async (row: Role) => {
  currentRole.value = row
  assignVisible.value = true
  try {
    const res = await getRolePermissionIds(row.id)
    const ids = res.data || []
    // 等待树渲染后回填选中
    setTimeout(() => {
      treeRef.value?.setCheckedKeys(ids)
    }, 50)
  } catch {
    // 忽略
  }
}

const handleAssignSubmit = async () => {
  if (!currentRole.value || !treeRef.value) return
  isSubmitting.value = true
  try {
    const checkedKeys = treeRef.value.getCheckedKeys(false) as number[]
    const halfCheckedKeys = treeRef.value.getHalfCheckedKeys() as number[]
    const allIds = [...new Set([...checkedKeys, ...halfCheckedKeys])]
    await assignRolePermissions(currentRole.value.id, allIds)
    ElMessage.success('分配成功')
    assignVisible.value = false
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
  loadPermTree()
})
</script>

<style scoped>
.role-page {
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

.assign-tip {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
