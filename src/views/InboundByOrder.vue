<template>
  <div class="inbound-by-order-container">
    <el-card class="inbound-by-order-card" shadow="never">
      <!-- ==================== 顶部标题区 ==================== -->
      <template #header>
        <div class="card-header">
          <h2 class="card-title">按订单入库</h2>
          <div class="header-actions">
            <el-button :icon="Refresh" :loading="listLoading" @click="loadOrderList">
              刷新订单
            </el-button>
          </div>
        </div>
      </template>

      <!-- 无权限提示 -->
      <el-result
        v-if="!pagePermission"
        icon="warning"
        title="暂无操作权限"
        sub-title="当前账号不具备入库操作权限，请联系管理员授权后重试"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/dashboard')">返回首页</el-button>
        </template>
      </el-result>

      <template v-else>
        <!-- ==================== 全局错误提示 ==================== -->
        <el-alert
          v-if="globalErrorMsg"
          :title="globalErrorMsg"
          type="error"
          show-icon
          closable
          class="global-error"
          @close="globalErrorMsg = ''"
        />

        <!-- ==================== 搜索/筛选区 ==================== -->
        <div class="search-area">
          <el-form :inline="true" :model="queryForm" class="search-form">
            <el-form-item label="关键字">
              <el-input
                v-model="queryForm.keyword"
                placeholder="订单编号 / 供应商名称"
                clearable
                :prefix-icon="Search"
                style="width: 240px"
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </el-form-item>
            <el-form-item label="订单状态">
              <el-select
                v-model="queryForm.status"
                placeholder="全部状态"
                clearable
                style="width: 150px"
                @change="handleSearch"
              >
                <el-option label="待入库" value="PENDING" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="已取消" value="CANCELLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- ==================== 订单列表 ==================== -->
        <!-- 加载中 -->
        <div v-if="listLoading" v-loading="listLoading" class="loading-box">
          <span>正在加载入库订单...</span>
        </div>

        <!-- 接口异常 -->
        <el-result
          v-else-if="listError"
          icon="error"
          title="加载入库订单失败"
          sub-title="请检查网络连接后重试"
        >
          <template #extra>
            <el-button type="primary" @click="loadOrderList">重新加载</el-button>
          </template>
        </el-result>

        <!-- 空数据 -->
        <el-empty v-else-if="filteredOrders.length === 0" description="暂无入库订单" :image-size="100">
          <el-button type="primary" @click="$router.push('/inbound-management/create-inbound')">
            去创建入库订单
          </el-button>
        </el-empty>

        <!-- 订单表格 -->
        <template v-else>
          <el-table
            :data="paginatedOrders"
            stripe
            border
            style="width: 100%"
            :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
            highlight-current-row
            @current-change="handleOrderSelect"
          >
            <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />

            <el-table-column prop="orderNo" label="订单编号" min-width="170" fixed="left">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.orderNo }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="orderType" label="订单类型" width="110" align="center">
              <template #default="{ row }">
                {{ orderTypeText(row.orderType) }}
              </template>
            </el-table-column>

            <el-table-column prop="supplier" label="供应商名称" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.supplier || '-' }}
              </template>
            </el-table-column>

            <el-table-column prop="totalQuantity" label="计划数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary" effect="plain">{{ row.totalQuantity }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="入库日期" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.remark || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :icon="Check"
                  :disabled="!isPendingStatus(row.status)"
                  @click="handleCheckInbound(row)"
                >
                  {{ isPendingStatus(row.status) ? '核对入库' : '不可入库' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="filteredOrders.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
            />
          </div>
        </template>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Check } from '@element-plus/icons-vue'
import { getInboundOrderList, type InboundOrderResponse } from '@/api/inbound'
import { usePagination } from '@/composables/usePagination'
import { hasPermission } from '@/utils/permission'
import { playCorrect, playError } from '@/utils/sound'

const router = useRouter()

/** 页面访问权限（meta 已由路由守卫校验，此处二次防御） */
const pagePermission = computed(() => hasPermission(['inbound:page']))

// ==================== 状态 ====================

const orderList = ref<InboundOrderResponse[]>([])
const listLoading = ref(false)
const listError = ref(false)
const globalErrorMsg = ref('')

const queryForm = ref({
  keyword: '',
  status: '' as '' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
})

// ==================== 分页（复用 usePagination，基于筛选后数据） ====================

const { currentPage, pageSize, paginatedData: paginatedOrders, handleSizeChange } = usePagination(
  () => filteredOrders.value
)

// ==================== 筛选与派生 ====================

/** 待入库状态集合（兼容中英文两种存储值） */
const PENDING_STATUSES = ['PENDING', '待入库']
const COMPLETED_STATUSES = ['COMPLETED', '已完成', '已入库']
const CANCELLED_STATUSES = ['CANCELLED', 'CANCELED', '已取消']

/** 判断是否为待入库状态 */
const isPendingStatus = (status?: string): boolean => {
  if (!status) return false
  const s = status.trim()
  return PENDING_STATUSES.includes(s.toUpperCase()) || s === '待入库'
}

/** 状态展示文案 */
const statusText = (status?: string): string => {
  if (!status) return '-'
  const s = status.trim()
  if (isPendingStatus(s)) return '待入库'
  if (COMPLETED_STATUSES.includes(s.toUpperCase()) || s === '已完成' || s === '已入库') return '已完成'
  if (CANCELLED_STATUSES.includes(s.toUpperCase()) || s === '已取消') return '已取消'
  return s
}

/** 状态标签颜色 */
const statusTagType = (status?: string): 'warning' | 'success' | 'info' | 'danger' => {
  if (!status) return 'info'
  const s = status.trim()
  if (isPendingStatus(s)) return 'warning'
  if (COMPLETED_STATUSES.includes(s.toUpperCase()) || s === '已完成' || s === '已入库') return 'success'
  if (CANCELLED_STATUSES.includes(s.toUpperCase()) || s === '已取消') return 'info'
  return 'danger'
}

/** 订单类型展示文案（兼容中英文） */
const orderTypeText = (type?: string): string => {
  if (!type) return '-'
  const t = type.trim()
  const map: Record<string, string> = {
    NORMAL: '普通入库',
    采购入库: '采购入库',
    退货入库: '退货入库',
    调拨入库: '调拨入库',
    其他入库: '其他入库'
  }
  return map[t] || t
}

/** 时间格式化：ISO → 可读 */
const formatTime = (time?: string): string => {
  if (!time) return '-'
  return time.replace('T', ' ')
}

/** 关键字/状态筛选后的完整列表 */
const filteredOrders = computed<InboundOrderResponse[]>(() => {
  const keyword = queryForm.value.keyword.trim().toLowerCase()
  const status = queryForm.value.status

  return orderList.value.filter((order) => {
    // 关键字：订单编号 / 供应商名称
    if (keyword) {
      const orderNo = (order.orderNo || '').toLowerCase()
      const supplier = (order.supplier || '').toLowerCase()
      if (!orderNo.includes(keyword) && !supplier.includes(keyword)) {
        return false
      }
    }
    // 状态筛选
    if (status) {
      const s = status
      const current = order.status?.trim() || ''
      if (s === 'PENDING' && !isPendingStatus(current)) return false
      if (s === 'COMPLETED' && !(COMPLETED_STATUSES.includes(current.toUpperCase()) || current === '已完成' || current === '已入库')) return false
      if (s === 'CANCELLED' && !(CANCELLED_STATUSES.includes(current.toUpperCase()) || current === '已取消')) return false
    }
    return true
  })
})

// ==================== 数据加载 ====================

/** 加载入库订单列表 */
const loadOrderList = async () => {
  listLoading.value = true
  listError.value = false
  globalErrorMsg.value = ''
  try {
    const response = await getInboundOrderList()
    const data = response?.data
    if (Array.isArray(data)) {
      orderList.value = data
    } else {
      orderList.value = []
    }
  } catch (error: any) {
    listError.value = true
    orderList.value = []
    globalErrorMsg.value =
      error?.isBusinessError
        ? error?.message || '加载入库订单失败'
        : error?.code === 'ECONNABORTED'
          ? '请求超时，请检查网络连接'
          : '网络异常，请检查网络连接后重试'
  } finally {
    listLoading.value = false
  }
}

// ==================== 交互 ====================

/** 查询 */
const handleSearch = () => {
  currentPage.value = 1
  if (filteredOrders.value.length === 0) {
    ElMessage.info('没有符合条件的结果')
    playError()
  } else {
    playCorrect()
  }
}

/** 重置筛选 */
const handleReset = () => {
  queryForm.value = { keyword: '', status: '' }
  currentPage.value = 1
  loadOrderList()
}

/** 选中订单行（仅高亮，不触发跳转） */
const handleOrderSelect = (row: InboundOrderResponse | null) => {
  if (!row) return
  currentOrder.value = row
}

/** 当前选中的订单 */
const currentOrder = ref<InboundOrderResponse | null>(null)

/**
 * 核对入库：
 * 1. 校验订单状态是否为「待入库」，异常则提示并阻止跳转
 * 2. 校验通过后跳转到「入库订单信息核对」页面
 */
const handleCheckInbound = (row: InboundOrderResponse) => {
  // 二次防御：状态必须为待入库
  if (!isPendingStatus(row.status)) {
    ElMessage.warning(
      `订单 ${row.orderNo} 当前状态为「${statusText(row.status)}」，仅待入库订单可进行核对入库`
    )
    return
  }

  // 订单不存在保护（列表数据异常时给出明确提示）
  if (!row.id) {
    ElMessage.error(`订单 ${row.orderNo} 不存在，请刷新列表后重试`)
    return
  }

  router.push({
    path: '/inbound-management/inbound-check',
    query: { id: String(row.id), orderNo: row.orderNo }
  })
}

// ==================== 初始化 ====================

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped>
.inbound-by-order-container {
  padding: 20px;
}

.inbound-by-order-card {
  border-radius: var(--wms-radius);
}

/* ===== 顶部标题 ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--wms-text);
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* ===== 全局错误 ===== */
.global-error {
  margin-bottom: 20px;
}

/* ===== 搜索区 ===== */
.search-area {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: var(--wms-radius);
  background: var(--el-fill-color-lighter);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

/* ===== 加载 / 空态 ===== */
.loading-box {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

/* ===== 分页 ===== */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  overflow-x: auto;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .inbound-by-order-container {
    padding: 12px;
  }

  .card-title {
    font-size: 18px;
  }

  .search-area {
    padding: 12px;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .search-form :deep(.el-form-item__content),
  .search-form :deep(.el-input),
  .search-form :deep(.el-select) {
    width: 100% !important;
  }

  .pagination-wrap {
    justify-content: center;
  }

  .pagination-wrap :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
