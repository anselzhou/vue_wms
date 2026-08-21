<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Refresh, Switch, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { queryMaterialStock, queryStockByTypeCode, type MaterialPositionInfo } from '@/api/inventory'

type QueryMode = 'material' | 'typeCode'

const queryMode = ref<QueryMode>('material')
const keyword = ref('')
const tableData = ref<MaterialPositionInfo[]>([])
const loading = ref(false)
const searched = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const tableRef = ref()
const selectedRow = ref<MaterialPositionInfo | null>(null)
const router = useRouter()

// 汇总统计（整体数据）
const totalQuantity = computed(() => tableData.value.reduce((sum, r) => sum + r.quantity, 0))
const totalBlocked = computed(() => tableData.value.reduce((sum, r) => sum + r.blockQuantity, 0))
const totalAvailable = computed(() => tableData.value.reduce((sum, r) => sum + r.availableQuantity, 0))

// 前端分页
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableData.value.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
  selectedRow.value = null
  tableRef.value?.setCurrentRow?.(undefined)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  selectedRow.value = null
  tableRef.value?.setCurrentRow?.(undefined)
}

const handleSearch = async () => {
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning(queryMode.value === 'material' ? '请输入物料编码' : '请输入款式编码')
    return
  }

  loading.value = true
  searched.value = true
  try {
    const response =
      queryMode.value === 'material'
        ? await queryMaterialStock(kw)
        : await queryStockByTypeCode(kw)

    if (response.data) {
      tableData.value = Array.isArray(response.data) ? response.data : []
      if (tableData.value.length === 0) {
        ElMessage.info('未查询到库存信息')
      } else {
        ElMessage.success(`查询成功，共找到 ${tableData.value.length} 条记录`)
      }
    } else {
      tableData.value = []
      ElMessage.info('未查询到库存信息')
    }
    currentPage.value = 1
  } catch {
    // 错误已在拦截器中统一处理
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  keyword.value = ''
  tableData.value = []
  searched.value = false
  currentPage.value = 1
  selectedRow.value = null
  tableRef.value?.setCurrentRow?.(undefined)
}

/** 表格当前行变化（单选高亮） */
const handleCurrentChange = (row: MaterialPositionInfo | null) => {
  selectedRow.value = row
}

/** 选中行的公共跳转参数 */
const selectedQuery = () => {
  const row = selectedRow.value
  if (!row) return {}
  return { position: row.position, material: row.material }
}

/** 移库：携带库位与物料编码跳转 */
const goRelocation = () => {
  if (!selectedRow.value) return
  router.push({ path: '/warehouse/relocation', query: selectedQuery() })
}

/** 出库：携带库位与物料编码跳转 */
const goOutbound = () => {
  if (!selectedRow.value) return
  router.push({ path: '/warehouse/outbound', query: selectedQuery() })
}

/** 下架：携带库位与物料编码跳转 */
const goDownShelf = () => {
  if (!selectedRow.value) return
  router.push({ path: '/warehouse/down-shelf', query: selectedQuery() })
}
</script>

<template>
  <div class="query-container">
    <el-card class="query-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">库存查询</h2>
          <el-tag v-if="searched" type="info" size="large">
            查询结果：{{ tableData.length }} 条
          </el-tag>
        </div>
      </template>

      <!-- 查询输入区 -->
      <div class="search-section">
        <el-form :inline="true" @submit.prevent="handleSearch">
          <el-form-item label="查询方式">
            <el-radio-group v-model="queryMode" size="large">
              <el-radio-button value="material">物料编码</el-radio-button>
              <el-radio-button value="typeCode">款式编码</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item :label="queryMode === 'material' ? '物料编码' : '款式编码'">
            <el-input
              v-model="keyword"
              :placeholder="queryMode === 'material' ? '请输入物料编码' : '请输入款式编码（支持模糊查询）'"
              size="large"
              clearable
              :prefix-icon="Search"
              style="width: 320px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :icon="Search" :loading="loading" @click="handleSearch">
              查询
            </el-button>
            <el-button size="large" :icon="Refresh" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 汇总统计 + 表格区域（仅在已查询时展示） -->
      <template v-if="searched">
        <!-- 汇总统计栏 -->
        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-label">库存合计</span>
            <el-tag type="primary" size="large">{{ totalQuantity }}</el-tag>
          </div>
          <div class="summary-item">
            <span class="summary-label">锁定数量</span>
            <el-tag type="warning" size="large">{{ totalBlocked }}</el-tag>
          </div>
          <div class="summary-item">
            <span class="summary-label">可用数量</span>
            <el-tag type="success" size="large">{{ totalAvailable }}</el-tag>
          </div>
        </div>

        <!-- 结果表格 -->
        <div class="table-section">
          <el-table
            ref="tableRef"
            :data="paginatedData"
            v-loading="loading"
            stripe
            border
            highlight-current-row
            style="width: 100%"
            empty-text="暂无库存数据"
            :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)' }"
            @current-change="handleCurrentChange"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />

            <el-table-column prop="position" label="库位" width="140" />

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

            <el-table-column prop="quantity" label="库存数量" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="primary" effect="plain">{{ row.quantity }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="blockQuantity" label="锁定数量" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="warning" effect="plain">{{ row.blockQuantity }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="availableQuantity" label="可用数量" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="success" effect="plain">{{ row.availableQuantity }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="tableData.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </template>

      <!-- 未查询时的空状态提示 -->
      <div v-else class="empty-hint">
        <el-empty description="请输入物料编码或款式编码进行查询" :image-size="120" />
      </div>
    </el-card>

    <!-- 底部操作栏：选中库存行后弹出移库/出库/下架 -->
    <transition name="dock-fade">
      <div v-if="selectedRow" class="action-dock">
        <div class="dock-info">
          <span class="dock-label">已选中库位</span>
          <el-tag type="success" effect="plain">{{ selectedRow.position }}</el-tag>
          <span class="dock-label">物料编码</span>
          <el-tag type="info">{{ selectedRow.material }}</el-tag>
        </div>
        <div class="dock-actions">
          <el-button type="warning" :icon="Switch" @click="goRelocation">移库</el-button>
          <el-button type="primary" :icon="ArrowUp" @click="goOutbound">出库</el-button>
          <el-button type="danger" :icon="ArrowDown" @click="goDownShelf">下架</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.query-container {
  padding: 20px;
}

.query-card {
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

.summary-bar {
  display: flex;
  gap: 32px;
  padding: 16px 0;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: var(--wms-text-secondary);
  font-weight: 500;
}

.table-section {
  margin-bottom: 16px;
  min-height: 200px;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--wms-border);
}

.empty-hint {
  padding: 60px 0;
}

/* 底部浮动操作栏 */
.action-dock {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--wms-surface);
  border: 1px solid var(--wms-border);
  border-radius: var(--wms-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.dock-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dock-label {
  font-size: 14px;
  color: var(--wms-text-secondary);
  font-weight: 500;
}

.dock-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dock-fade-enter-active,
.dock-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.dock-fade-enter-from,
.dock-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .query-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-bar {
    gap: 16px;
  }

  .pagination-section {
    justify-content: center;
  }
}
</style>
