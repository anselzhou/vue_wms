<template>
  <div class="log-page">
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
        <el-form-item label="操作">
          <el-input
            v-model="query.operation"
            placeholder="请输入操作名称"
            clearable
            style="width: 180px"
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
      <el-table v-loading="isLoading" :data="tableData" border stripe>
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" min-width="130">
          <template #default="{ row }">
            {{ row.operation || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="method" label="请求方法" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.method || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="params" label="请求参数" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.params || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="140">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.errorMsg || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="170" align="center" />
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getOperationLogPage, type LogQuery } from '@/api/log'
import type { OperationLog } from '@/types/permission'

const query = reactive<Required<Pick<LogQuery, 'page' | 'pageSize'>> & LogQuery>({
  username: undefined,
  operation: undefined,
  page: 1,
  pageSize: 20
})

const isLoading = ref(false)
const tableData = ref<OperationLog[]>([])
const total = ref(0)

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getOperationLogPage({ ...query })
    tableData.value = res.data.list
    total.value = Number(res.data.total)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  query.page = 1
  fetchData()
}

const handleReset = () => {
  query.username = undefined
  query.operation = undefined
  query.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.log-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
