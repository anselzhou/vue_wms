<template>
  <div class="temp-auth-page">
    <!-- 查询条件 -->
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
            <el-option label="待审批" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已过期" :value="2" />
            <el-option label="已撤销" :value="3" />
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
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增临时授权</el-button>
        <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
      </div>

      <el-table v-loading="isLoading" :data="tableData" border stripe>
        <el-table-column prop="username" label="用户" min-width="120">
          <template #default="{ row }">
            {{ row.username || `ID:${row.userId}` }}
          </template>
        </el-table-column>
        <el-table-column label="权限标识" min-width="220">
          <template #default="{ row }">
            <el-tag
              v-for="code in row.permCodeList || []"
              :key="code"
              size="small"
              type="success"
              class="mr-1"
            >
              {{ code }}
            </el-tag>
            <span v-if="!row.permCodeList || row.permCodeList.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveTime" label="生效时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.effectiveTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="失效时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.expireTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="授权原因" min-width="160">
          <template #default="{ row }">
            <el-tooltip :content="row.reason || ''" placement="top" :disabled="!row.reason">
              <span class="reason-text">{{ row.reason || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.createTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0 || row.status === 1"
              link
              type="danger"
              :icon="Remove"
              @click="handleRevoke(row)"
            >
              撤销
            </el-button>
            <span v-else>-</span>
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

    <!-- 新增临时授权对话框 -->
    <el-dialog v-model="dialogVisible" title="新增临时授权" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="选择用户" prop="userId">
          <el-select
            v-model="form.userId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入用户名搜索"
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.username}${user.nickname ? '（' + user.nickname + '）' : ''}`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择权限" prop="permCodes">
          <el-select
            v-model="form.permCodes"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="选择按钮权限标识，支持自定义输入"
            style="width: 100%"
          >
            <el-option-group v-for="group in permGroupOptions" :key="group.label" :label="group.label">
              <el-option
                v-for="perm in group.options"
                :key="perm.permCode"
                :label="`${perm.permName}（${perm.permCode}）`"
                :value="perm.permCode"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="生效时间" prop="effectiveTime">
          <el-date-picker
            v-model="form.effectiveTime"
            type="datetime"
            placeholder="选择生效时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="失效时间" prop="expireTime">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="选择失效时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disableExpireDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="授权原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="请填写授权原因（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Refresh, Remove, Search } from '@element-plus/icons-vue'
import { getTempAuthPage, createTempAuth, revokeTempAuth } from '@/api/tempAuth'
import type { TempAuthCreateParams } from '@/api/tempAuth'
import { getUserPage } from '@/api/user'
import type { UserQuery } from '@/api/user'
import { getPermissionTree } from '@/api/permission'
import type { Permission } from '@/types/permission'
import type { User } from '@/types/user'
import { TEMP_AUTH_STATUS_LABEL, type TempPermission } from '@/types/tempAuth'
import { playCorrect, playError } from '@/utils/sound'

const query = reactive<{ username?: string; status?: number; page: number; pageSize: number }>({
  username: undefined,
  status: undefined,
  page: 1,
  pageSize: 20
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const tableData = ref<TempPermission[]>([])
const total = ref(0)

const dialogVisible = ref(false)
const userLoading = ref(false)
const userOptions = ref<User[]>([])
const permTree = ref<Permission[]>([])

const formRef = ref<FormInstance>()
const form = reactive<TempAuthCreateParams>({
  userId: 0,
  permCodes: [],
  effectiveTime: '',
  expireTime: '',
  reason: ''
})

const formRules: FormRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  permCodes: [
    {
      validator: (_rule, value: string[] | undefined, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请选择或输入至少一个权限标识'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
  expireTime: [{ required: true, message: '请选择失效时间', trigger: 'change' }],
  reason: [{ required: true, message: '请填写授权原因', trigger: 'blur' }]
}

// 权限选项：从权限树中提取按钮权限，按所属一级菜单/目录分组
const permGroupOptions = computed(() => {
  const groups: { label: string; options: { permCode: string; permName: string }[] }[] = []
  const getGroup = (label: string) => {
    let g = groups.find((item) => item.label === label)
    if (!g) {
      g = { label, options: [] }
      groups.push(g)
    }
    return g
  }
  const walk = (list: Permission[], groupLabel: string) => {
    list.forEach((p) => {
      if (p.permType === 'button') {
        getGroup(groupLabel).options.push({ permCode: p.permCode, permName: p.permName })
      }
      if (p.children && p.children.length) {
        walk(p.children, p.permType === 'button' ? groupLabel : p.permName || groupLabel)
      }
    })
  }
  walk(permTree.value, '其他权限')
  return groups.filter((g) => g.options.length > 0)
})

const statusLabel = (s: number) => TEMP_AUTH_STATUS_LABEL[s as keyof typeof TEMP_AUTH_STATUS_LABEL] || '未知'

const statusTagType = (s: number) => {
  switch (s) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'info'
    case 3: return 'danger'
    default: return 'info'
  }
}

const disableExpireDate = (date: Date) => {
  const effective = new Date(form.effectiveTime)
  if (isNaN(effective.getTime())) return false
  return date.getTime() <= effective.getTime()
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getTempAuthPage({ ...query })
    tableData.value = (res.data.list || []).map((item) => ({
      ...item,
      permCodeList: item.permCodes ? item.permCodes.split(',').map((s) => s.trim()).filter(Boolean) : []
    }))
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

const searchUsers = async (keyword: string) => {
  if (!keyword) {
    userOptions.value = []
    return
  }
  userLoading.value = true
  try {
    const params: UserQuery = { username: keyword, page: 1, pageSize: 20 }
    const res = await getUserPage(params)
    userOptions.value = res.data.list || []
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

const loadPermTree = async () => {
  try {
    const res = await getPermissionTree()
    permTree.value = res.data || []
  } catch {
    permTree.value = []
  }
}

const handleCreate = () => {
  form.userId = 0
  form.permCodes = []
  form.effectiveTime = ''
  form.expireTime = ''
  form.reason = ''
  userOptions.value = []
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
    await createTempAuth({ ...form })
    ElMessage.success('提交成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    isSubmitting.value = false
  }
}

const handleRevoke = async (row: TempPermission) => {
  try {
    await ElMessageBox.confirm(`确定要撤销用户「${row.username || row.userId}」的临时授权吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  await revokeTempAuth(row.id)
  ElMessage.success('撤销成功')
  fetchData()
}

onMounted(() => {
  fetchData()
  loadPermTree()
})
</script>

<style scoped>
.temp-auth-page {
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

.reason-text {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.mr-1 {
  margin-right: 4px;
}
</style>
