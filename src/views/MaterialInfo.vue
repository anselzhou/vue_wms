<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMaterialInfo } from '@/api/material'
import { usePagination, PAGE_SIZE_OPTIONS } from '@/composables/usePagination'
import { playCorrect, playError } from '@/utils/sound'

interface MaterialInfo {
  material: string
  ean: string
  brand: string
  color: string
  size: string
  description: string
  [key: string]: any
}

const keyword = ref('')
const tableData = ref<MaterialInfo[]>([])
const loading = ref(false)
const searched = ref(false)

// 前端分页：状态与分页切片逻辑统一由 usePagination 管理
const { currentPage, pageSize, total, paginatedData, handleSizeChange, resetPage } =
  usePagination(() => tableData.value)

// 回车直接查询：输入框留空时查询所有物料信息
const handleSearch = async () => {
  // 请求进行中忽略重复触发（回车 + 表单提交、连按回车等场景）
  if (loading.value) return
  const kw = keyword.value.trim()
  loading.value = true
  searched.value = true
  try {
    const response = await getMaterialInfo(kw)
    const data = response?.data ?? []
    tableData.value = data as MaterialInfo[]
    if (tableData.value.length === 0) {
      ElMessage.info('未查询到物料信息')
      playError()
    } else {
      ElMessage.success(`查询成功，共找到 ${tableData.value.length} 条记录`)
      playCorrect()
    }
    resetPage()
  } catch (error) {
    tableData.value = []
    // 优先展示后端返回的业务错误信息（如"未找到该物料信息"），网络等异常再回退到通用文案
    const message = (error as Error)?.message
    ElMessage.error(message || '查询物料信息失败，请稍后重试')
    playError()
  } finally {
    loading.value = false
  }
}

// 重置：清空输入并重新查询全部物料
const handleReset = () => {
  keyword.value = ''
  handleSearch()
}
</script>

<template>
  <div class="material-container">
    <el-card class="material-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">物料信息查询</h2>
          <el-tag v-if="searched" type="info" size="large">
            查询结果：{{ tableData.length }} 条
          </el-tag>
        </div>
      </template>

      <!-- 查询输入区：回车直接查询，无需点击实体按钮 -->
      <div class="search-section">
        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="物料编码">
            <el-input
              v-model="keyword"
              placeholder="请输入物料编码（留空则查询全部物料）"
              size="large"
              clearable
              style="width: 320px"
              @keyup.enter.prevent="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button size="large" :icon="Refresh" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 结果表格 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="paginatedData"
          stripe
          border
          style="width: 100%"
          empty-text="暂无物料数据"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)' }"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="material" label="物料编码" width="160">
            <template #default="{ row }">
              <el-tag type="info">{{ row.material }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="ean" label="EAN码" width="150">
            <template #default="{ row }">
              {{ row.ean || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="brand" label="品牌" width="120">
            <template #default="{ row }">
              {{ row.brand || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="color" label="颜色" width="100" align="center">
            <template #default="{ row }">
              {{ row.color || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="size" label="尺码" width="100" align="center">
            <template #default="{ row }">
              {{ row.size || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="PAGE_SIZE_OPTIONS"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.material-container {
  padding: 20px;
}

.material-card {
  border-radius: var(--wms-radius);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--wms-text);
}

.search-section {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--wms-border);
}

.table-section {
  margin: 16px 0;
  min-height: 200px;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--wms-border);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-section {
    justify-content: center;
  }
}
</style>
