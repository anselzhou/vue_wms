<template>
  <div class="perm-page">
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleCreate()">新增权限</el-button>
        <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
      </div>

      <el-table v-loading="isLoading" :data="tableData" border stripe row-key="id" default-expand-all>
        <el-table-column prop="permName" label="权限名称" min-width="160" />
        <el-table-column prop="permCode" label="权限编码" min-width="150" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.permType)" size="small">
              {{ typeLabel(row.permType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据范围" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.permType === 'data'" size="small" type="info">
              {{ scopeLabel(row.dataScope) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140">
          <template #default="{ row }">
            {{ row.path || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件" min-width="140">
          <template #default="{ row }">
            {{ row.component || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Plus" @click="handleCreate(row)">新增</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="上级权限" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="{ label: 'permName', value: 'id', children: 'children' }"
            check-strictly
            default-expand-all
            placeholder="不选则为顶级权限"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="permName">
          <el-input v-model="form.permName" placeholder="如 用户管理 / 新增用户" />
        </el-form-item>
        <el-form-item label="权限编码" prop="permCode">
          <el-input v-model="form.permCode" placeholder="如 user:create" />
        </el-form-item>
        <el-form-item label="权限类型" prop="permType">
          <el-select v-model="form.permType" style="width: 100%">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="数据" value="data" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.permType === 'data'" label="数据范围" prop="dataScope">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option label="全部数据" value="ALL" />
            <el-option label="本部门数据" value="DEPT" />
            <el-option label="仅本人数据" value="SELF" />
          </el-select>
        </el-form-item>
        <template v-if="form.permType === 'menu'">
          <el-form-item label="路由路径" prop="path">
            <el-input v-model="form.path" placeholder="如 /system/user/list" />
          </el-form-item>
          <el-form-item label="组件" prop="component">
            <el-input v-model="form.component" placeholder="如 system/user/index" />
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 User" />
          </el-form-item>
        </template>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import {
  createPermission,
  deletePermission,
  getPermissionTree,
  updatePermission
} from '@/api/permission'
import type { PermissionParams } from '@/api/permission'
import type { Permission, PermType } from '@/types/permission'

const isLoading = ref(false)
const isSubmitting = ref(false)
const tableData = ref<Permission[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const formRef = ref<FormInstance>()
const form = reactive<PermissionParams>({
  permCode: '',
  permName: '',
  permType: 'menu',
  parentId: 0,
  dataScope: 'ALL',
  path: '',
  component: '',
  icon: '',
  sortOrder: 0,
  status: 1
})

const formRules: FormRules = {
  permName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { max: 64, message: '权限名称不能超过 64 个字符', trigger: 'blur' }
  ],
  permCode: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9:_-]{1,63}$/, message: '权限编码格式不正确（如 user:create）', trigger: 'blur' }
  ],
  permType: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  path: [{ max: 128, message: '路由路径不能超过 128 个字符', trigger: 'blur' }]
}

const typeLabel = (t: PermType) => {
  switch (t) {
    case 'menu': return '菜单'
    case 'button': return '按钮'
    case 'data': return '数据'
    default: return t
  }
}

const typeTagType = (t: PermType) => {
  switch (t) {
    case 'menu': return 'primary'
    case 'button': return 'success'
    case 'data': return 'warning'
    default: return 'info'
  }
}

const scopeLabel = (scope?: string) => {
  switch (scope) {
    case 'ALL': return '全部'
    case 'DEPT': return '本部门'
    case 'SELF': return '本人'
    default: return scope || '-'
  }
}

const parentOptions = computed(() => {
  // 构建可选择父级的树（排除自身）
  const clone = (list: Permission[]): Permission[] =>
    list
      .filter((p) => p.id !== editingId.value)
      .map((p) => ({
        ...p,
        children: p.children ? clone(p.children) : undefined
      }))
  return clone(tableData.value)
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getPermissionTree()
    tableData.value = res.data || []
  } finally {
    isLoading.value = false
  }
}

const handleCreate = (parent?: Permission) => {
  isEdit.value = false
  editingId.value = null
  form.permCode = ''
  form.permName = ''
  form.permType = 'menu'
  form.parentId = parent ? parent.id : 0
  form.dataScope = 'ALL'
  form.path = ''
  form.component = ''
  form.icon = ''
  form.sortOrder = 0
  form.status = 1
  dialogVisible.value = true
}

const handleEdit = (row: Permission) => {
  isEdit.value = true
  editingId.value = row.id
  form.permCode = row.permCode
  form.permName = row.permName
  form.permType = row.permType
  form.parentId = row.parentId ?? 0
  form.dataScope = row.dataScope || 'ALL'
  form.path = row.path || ''
  form.component = row.component || ''
  form.icon = row.icon || ''
  form.sortOrder = row.sortOrder ?? 0
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
      await updatePermission(editingId.value!, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createPermission({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (row: Permission) => {
  try {
    await ElMessageBox.confirm(`确定要删除权限「${row.permName}」吗？此操作不可恢复。`, '警告', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await deletePermission(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.perm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  margin-bottom: 12px;
}
</style>
