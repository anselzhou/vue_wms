<template>
  <div class="menu-page">
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleCreate()">新增</el-button>
        <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
      </div>

      <!-- 菜单树表格 -->
      <el-table
        v-loading="isLoading"
        :data="tableData"
        border
        stripe
        row-key="id"
        default-expand-all
      >
        <el-table-column prop="permName" label="名称" min-width="180" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.permType)" size="small">
              {{ typeLabel(row.permType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由" min-width="150">
          <template #default="{ row }">
            {{ row.path || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="150">
          <template #default="{ row }">
            {{ row.component || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="permCode" label="权限标识" min-width="150">
          <template #default="{ row }">
            {{ row.permCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            {{ row.icon || '-' }}
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
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="上级节点" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="{ label: 'permName', value: 'id', children: 'children' }"
            check-strictly
            default-expand-all
            placeholder="不选则为顶级节点"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="名称" prop="permName">
          <el-input v-model="form.permName" placeholder="如 用户管理 / 新增用户" />
        </el-form-item>
        <el-form-item label="类型" prop="permType">
          <el-select v-model="form.permType" style="width: 100%">
            <el-option label="目录" value="catalog" />
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <template v-if="form.permType === 'catalog'">
          <el-form-item label="路由路径" prop="path">
            <el-input v-model="form.path" placeholder="如 /system" />
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 Setting" />
          </el-form-item>
        </template>
        <template v-if="form.permType === 'menu'">
          <el-form-item label="路由路径" prop="path">
            <el-input v-model="form.path" placeholder="如 /system/user/list" />
          </el-form-item>
          <el-form-item label="组件路径" prop="component">
            <el-input v-model="form.component" placeholder="如 system/user/index" />
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 User" />
          </el-form-item>
        </template>
        <el-form-item v-if="form.permType !== 'catalog'" label="权限标识" prop="permCode">
          <el-input v-model="form.permCode" placeholder="如 user:create" />
        </el-form-item>
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
  permType: 'catalog',
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
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 64, message: '名称不能超过 64 个字符', trigger: 'blur' }
  ],
  permCode: [
    {
      validator: (_rule, value, callback) => {
        if (form.permType === 'catalog') {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请输入权限标识'))
          return
        }
        if (!/^[a-zA-Z][a-zA-Z0-9:_-]{1,63}$/.test(value)) {
          callback(new Error('权限标识格式不正确（如 user:create）'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  permType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  path: [{ max: 128, message: '路由路径不能超过 128 个字符', trigger: 'blur' }]
}

const typeLabel = (t: PermType) => {
  switch (t) {
    case 'catalog': return '目录'
    case 'menu': return '菜单'
    case 'button': return '按钮'
    case 'data': return '数据'
    default: return t
  }
}

const typeTagType = (t: PermType) => {
  switch (t) {
    case 'catalog': return 'warning'
    case 'menu': return 'primary'
    case 'button': return 'success'
    case 'data': return 'info'
    default: return 'info'
  }
}

const parentOptions = computed(() => {
  // 构建可选择父级的树（排除自身，且只允许目录/菜单作为父级）
  const clone = (list: Permission[]): Permission[] =>
    list
      .filter((p) => p.id !== editingId.value && p.permType !== 'button' && p.permType !== 'data')
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
  // 根据父节点类型推断新增类型：父为目录 → 新增菜单；父为菜单 → 新增按钮；无父 → 目录
  if (parent?.permType === 'catalog') form.permType = 'menu'
  else if (parent?.permType === 'menu') form.permType = 'button'
  else form.permType = 'catalog'
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
  form.permType = row.permType === 'data' ? 'menu' : row.permType
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
    await ElMessageBox.confirm(`确定要删除「${row.permName}」吗？子节点将一并删除，此操作不可恢复。`, '警告', {
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
.menu-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  margin-bottom: 12px;
}
</style>
