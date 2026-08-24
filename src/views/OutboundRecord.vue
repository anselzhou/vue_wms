<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getOutboundList, type OutboundRecord } from '@/api/outbound'
import { usePagination, PAGE_SIZE_OPTIONS } from '@/composables/usePagination'
import { playCorrect, playError } from '@/utils/sound'

const loading = ref(false)
const records = ref<OutboundRecord[]>([])
const searched = ref(false)
const keyword = ref('')

const {
  currentPage,
  pageSize,
  total,
  paginatedData,
  handleSizeChange,
  resetPage
} = usePagination<OutboundRecord>(() => filteredRecords.value)

/** 前端关键字过滤（按出库单号/库位/物料编码模糊匹配） */
const filteredRecords = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return records.value
  return records.value.filter(
    r =>
      r.orderNo?.toLowerCase().includes(kw) ||
      r.position?.toLowerCase().includes(kw) ||
      r.material?.toLowerCase().includes(kw)
  )
})

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await getOutboundList()
    records.value = Array.isArray(res?.data) ? res.data : []
    searched.value = true
    resetPage()
    if (records.value.length === 0) {
      ElMessage.info('暂无出库记录')
    } else {
      ElMessage.success(`查询成功，共 ${records.value.length} 条出库记录`)
    }
  } catch {
    records.value = []
    searched.value = true
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  resetPage()
  const kw = keyword.value.trim()
  if (!kw) {
    // 空关键字：等价于展示全部记录
    playCorrect()
    return
  }
  if (filteredRecords.value.length === 0) {
    playError()
  } else {
    playCorrect()
  }
}

const handleReset = () => {
  keyword.value = ''
  resetPage()
}

onMounted(loadRecords)
</script>

<template>
  <div class="record-container">
    <el-card class="record-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">出库记录</h2>
          <el-tag v-if="searched" type="info" size="large">
            共 {{ filteredRecords.length }} 条
          </el-tag>
        </div>
      </template>

      <!-- 查询输入区 -->
      <div class="search-section">
        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="关键字">
            <el-input
              v-model="keyword"
              placeholder="出库单号 / 库位 / 物料编码"
              size="large"
              clearable
              :prefix-icon="Search"
              style="width: 320px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :icon="Search" @click="handleSearch">
              查询
            </el-button>
            <el-button size="large" :icon="Refresh" @click="loadRecords">
              刷新
            </el-button>
            <el-button size="large" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 结果表格 -->
      <div class="table-section">
        <el-table
          :data="paginatedData"
          v-loading="loading"
          stripe
          border
          style="width: 100%"
          empty-text="暂无出库记录"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)' }"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="orderNo" label="出库单号" min-width="180">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ row.orderNo }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="position" label="库位" width="130">
            <template #default="{ row }">
              {{ row.position || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="ean" label="EAN码" width="150">
            <template #default="{ row }">
              {{ row.ean || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="material" label="物料编码" min-width="150">
            <template #default="{ row }">
              {{ row.material || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="quantity" label="出库数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="danger" effect="plain">{{ row.quantity }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="operatorName" label="操作员" width="120" align="center">
            <template #default="{ row }">
              {{ row.operatorName || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.remark || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="出库时间" width="180" align="center">
            <template #default="{ row }">
              {{ row.createTime || '-' }}
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
.record-container {
  padding: 20px;
}

.record-card {
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
  margin-top: 16px;
  min-height: 200px;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--wms-border);
}

@media (max-width: 768px) {
  .record-container {
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
