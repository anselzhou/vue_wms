<template>
  <div class="picking-container">
    <el-card class="picking-card" shadow="never">
      <!-- ==================== 顶部标题区 ==================== -->
      <template #header>
        <div class="card-header">
          <h2 class="card-title">按订单拣货</h2>
          <div class="header-actions">
            <el-button :icon="Refresh" :loading="listLoading" @click="loadOrderList">
              刷新订单
            </el-button>
          </div>
        </div>
      </template>

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

      <!-- ==================== 拣货单列表 ==================== -->
      <div class="section">
        <h3 class="section-title">待拣货订单</h3>

        <!-- 加载中 -->
        <div v-if="listLoading" v-loading="listLoading" class="loading-box">
          <span>正在加载拣货订单...</span>
        </div>

        <!-- 接口异常 -->
        <el-result
          v-else-if="listError"
          icon="error"
          title="加载拣货订单失败"
          sub-title="请检查网络连接后重试"
        >
          <template #extra>
            <el-button type="primary" @click="loadOrderList">重新加载</el-button>
          </template>
        </el-result>

        <!-- 空数据 -->
        <el-empty v-else-if="orderList.length === 0" description="暂无待拣货订单" :image-size="100">
          <el-button type="primary" @click="goCreatePicking">去创建拣货订单</el-button>
        </el-empty>

        <!-- 订单列表 -->
        <el-table
          v-else
          :data="orderList"
          stripe
          border
          style="width: 100%"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
          highlight-current-row
          @current-change="handleOrderSelect"
        >
          <el-table-column prop="orderNo" label="拣货订单号" min-width="180">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.orderNo }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="totalQuantity" label="总数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ row.totalQuantity }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" min-width="160">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.remark || '-' }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :disabled="row.status === 'COMPLETED'"
                @click="handleOrderSelect(row)"
              >
                {{ row.status === 'COMPLETED' ? '已完成' : '开始拣货' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-divider v-if="currentOrder" />

      <!-- ==================== 当前拣货订单详情 ==================== -->
      <div v-if="currentOrder" class="section">
        <div class="order-info-header">
          <h3 class="section-title">
            拣货明细
            <el-tag size="small" type="info" class="order-no-tag">
              {{ currentOrder.orderNo }}
            </el-tag>
          </h3>
          <div class="order-progress">
            <el-progress
              :percentage="progressPercent"
              :stroke-width="14"
              :format="progressText"
              style="width: 280px"
            />
          </div>
        </div>

        <!-- 当前待拣位置提示 -->
        <el-alert
          v-if="currentPendingItem"
          class="current-target-alert"
          type="warning"
          show-icon
          :closable="false"
        >
          <template #title>
            <div class="current-target">
              <span class="target-label">当前应拣库位：</span>
              <el-tag size="large" type="warning" effect="dark">{{ currentPendingItem.position || '未分配库位' }}</el-tag>
              <span class="target-divider">→</span>
              <el-tag size="large" type="success">{{ currentPendingItem.material }}</el-tag>
              <span class="target-qty">需拣 {{ currentPendingItem.requiredQuantity }} 件</span>
            </div>
          </template>
        </el-alert>
        <el-alert
          v-else-if="currentOrder && allPicked"
          class="current-target-alert"
          type="success"
          show-icon
          :closable="false"
          title="本订单所有拣货项均已确认完成"
        />

        <!-- 条码校验输入区 -->
        <div class="scan-area">
          <el-input
            v-model="scanInput"
            placeholder="扫描/输入商品条码或物料编码后回车确认拣货"
            size="large"
            clearable
            :prefix-icon="Search"
            :disabled="!currentPendingItem || allPicked"
            @keyup.enter="handleScanConfirm"
          >
            <template #append>
              <el-button :icon="Check" :disabled="!currentPendingItem || allPicked" @click="handleScanConfirm">
                确认拣货
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 明细表格 -->
        <el-table
          v-loading="detailLoading"
          :data="sortedItems"
          stripe
          border
          style="width: 100%"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
          :row-class-name="tableRowClassName"
          max-height="500"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="position" label="库位" width="150">
            <template #default="{ row }">
              <el-tag
                :type="row.position ? (isCurrentItem(row) ? 'warning' : 'info') : 'danger'"
                effect="plain"
                size="small"
              >
                {{ row.position || '未分配' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="material" label="物料编码" min-width="140">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.material }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="ean" label="EAN/条码" min-width="150">
            <template #default="{ row }">
              {{ row.ean || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="requiredQuantity" label="应拣数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ row.requiredQuantity }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="pickedQuantity" label="已拣数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.pickedQuantity > 0 ? 'success' : 'info'" effect="plain">
                {{ row.pickedQuantity }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'COMPLETED'" type="success" size="small">
                已完成
              </el-tag>
              <el-tag v-else type="warning" size="small">
                待拣货
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="success"
                size="small"
                :disabled="row.status === 'COMPLETED'"
                @click="confirmPicked(row)"
              >
                {{ row.status === 'COMPLETED' ? '已确认' : '确认拣货' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Check } from '@element-plus/icons-vue'
import {
  getPickingOrderList,
  getPickingOrderByNo,
  getPickingOrderItems,
  completePickingOrder,
  updatePickingOrderStatus,
  type PickingOrder,
  type PickingOrderItem
} from '@/api/outbound'

const router = useRouter()

// ==================== 状态 ====================

const orderList = ref<PickingOrder[]>([])
const listLoading = ref(false)
const listError = ref(false)
const globalErrorMsg = ref('')

const currentOrder = ref<PickingOrder | null>(null)
const detailLoading = ref(false)
const scanInput = ref('')

// ==================== 订单列表 ====================

const statusText = (status: string): string => {
  if (status === 'COMPLETED') return '已完成'
  if (status === 'PENDING') return '待拣货'
  return status || '-'
}

const formatTime = (time?: string): string => {
  if (!time) return '-'
  return time.replace('T', ' ')
}

/** 加载待拣货订单列表 */
const loadOrderList = async () => {
  listLoading.value = true
  listError.value = false
  try {
    const response: any = await getPickingOrderList()
    if (response.data) {
      orderList.value = Array.isArray(response.data) ? response.data : []
      if (orderList.value.length === 0) {
        ElMessage.info('暂无拣货订单')
      }
    } else {
      orderList.value = []
    }
  } catch {
    listError.value = true
    orderList.value = []
  } finally {
    listLoading.value = false
  }
}

/** 选择订单：加载明细（重复选择同一订单时忽略） */
const handleOrderSelect = async (row: PickingOrder | null) => {
  if (!row) return

  // 已完成订单不可重复拣货
  if (row.status === 'COMPLETED') {
    ElMessage.info('该订单已完成拣货')
    return
  }

  // 重复选择同一订单：忽略（避免重复加载）
  if (currentOrder.value && currentOrder.value.id === row.id) {
    return
  }

  detailLoading.value = true
  globalErrorMsg.value = ''
  try {
    // 优先使用订单号查询（含完整明细），兼容 items 为空的情况
    const response: any = await getPickingOrderByNo(row.orderNo)
    const order: PickingOrder = response.data || row

    // 若明细仍为空，尝试按 orderId 拉取明细
    if (!order.items || order.items.length === 0) {
      const itemsResp: any = await getPickingOrderItems(order.id)
      order.items = Array.isArray(itemsResp.data) ? itemsResp.data : []
    }

    currentOrder.value = order
    scanInput.value = ''

    if (!order.items || order.items.length === 0) {
      ElMessage.warning('该订单没有可拣货的明细')
    } else {
      ElMessage.success(`已加载订单 ${order.orderNo}，共 ${order.items.length} 个拣货项`)
    }
  } catch (error: any) {
    globalErrorMsg.value = error?.message || '加载拣货订单明细失败'
    currentOrder.value = null
  } finally {
    detailLoading.value = false
  }
}

const goCreatePicking = () => {
  router.push('/picking/create-order')
}

// ==================== 明细排序与当前项 ====================

/** 排序后的拣货明细：有库位按库位升序，未分配库位排最后 */
const sortedItems = computed<PickingOrderItem[]>(() => {
  const items = [...(currentOrder.value?.items || [])]

  // 未完成的排在前面（当前待拣优先展示），已完成排后面
  const pending = items.filter(i => i.status !== 'COMPLETED')
  const completed = items.filter(i => i.status === 'COMPLETED')

  const sortKey = (i: PickingOrderItem) => {
    if (!i.position || i.position.trim() === '') return Infinity
    // 按库位编码升序（字符串比较，忽略大小写）
    return i.position.toUpperCase()
  }

  pending.sort((a, b) => {
    const ka = sortKey(a)
    const kb = sortKey(b)
    if (ka === Infinity && kb === Infinity) return 0
    if (ka === Infinity) return 1
    if (kb === Infinity) return -1
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })

  completed.sort((a, b) => {
    const ka = sortKey(a)
    const kb = sortKey(b)
    if (ka === Infinity && kb === Infinity) return 0
    if (ka === Infinity) return 1
    if (kb === Infinity) return -1
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })

  return [...pending, ...completed]
})

/** 当前待拣的拣货项（第一个未完成项） */
const currentPendingItem = computed<PickingOrderItem | null>(() => {
  return sortedItems.value.find(i => i.status !== 'COMPLETED') || null
})

/** 是否全部已拣完 */
const allPicked = computed<boolean>(() => {
  if (!currentOrder.value?.items || currentOrder.value.items.length === 0) return false
  return currentOrder.value.items.every(i => i.status === 'COMPLETED')
})

/** 进度百分比 */
const progressPercent = computed<number>(() => {
  const items = currentOrder.value?.items || []
  if (items.length === 0) return 0
  const completed = items.filter(i => i.status === 'COMPLETED').length
  return Math.round((completed / items.length) * 100)
})

const progressText = (percent: number): string => {
  const items = currentOrder.value?.items || []
  const completed = items.filter(i => i.status === 'COMPLETED').length
  return `${completed}/${items.length} 项（${percent}%）`
}

/** 当前行是否为待拣目标行（高亮） */
const isCurrentItem = (row: PickingOrderItem): boolean => {
  return !!currentPendingItem.value && currentPendingItem.value.id === row.id
}

/** 表格行样式：当前待拣行高亮 */
const tableRowClassName = ({ row }: { row: PickingOrderItem }): string => {
  return isCurrentItem(row) ? 'current-target-row' : ''
}

// ==================== 拣货确认 ====================

/**
 * 校验输入的条码/物料编码是否匹配当前待拣项。
 * 匹配规则：扫描值等于当前项的 ean 或 material（忽略大小写与首尾空白）。
 */
const validateScan = (scanValue: string, item: PickingOrderItem): boolean => {
  const value = scanValue.trim().toUpperCase()
  if (!value) return false
  const ean = (item.ean || '').trim().toUpperCase()
  const material = (item.material || '').trim().toUpperCase()
  return value === ean || value === material
}

/** 确认拣货（前端状态推进，随后同步后端） */
const confirmPicked = async (row: PickingOrderItem) => {
  if (row.status === 'COMPLETED') return

  // 前端推进状态
  row.status = 'COMPLETED'
  row.pickedQuantity = row.requiredQuantity

  ElMessage.success(`已确认拣货：${row.material} @ ${row.position || '未分配库位'}`)

  // 若所有项均完成，则完成订单
  if (allPicked.value) {
    await handleOrderCompleted()
  }
}

/** 条码扫描/输入确认 */
const handleScanConfirm = async () => {
  const value = scanInput.value.trim()
  if (!value) {
    ElMessage.warning('请输入或扫描条码')
    return
  }

  const target = currentPendingItem.value
  if (!target) {
    ElMessage.info('当前没有待拣货的拣货项')
    scanInput.value = ''
    return
  }

  if (!validateScan(value, target)) {
    ElMessage.error(`条码不匹配当前待拣项「${target.material}」，请重新扫描`)
    scanInput.value = ''
    return
  }

  scanInput.value = ''
  await confirmPicked(target)
}

/** 订单全部拣货完成：弹窗提示 + 更新订单状态 */
const handleOrderCompleted = async () => {
  const order = currentOrder.value
  if (!order) return

  try {
    await ElMessageBox.alert(
      `订单 ${order.orderNo} 的所有拣货项均已确认完成！\n共 ${order.items?.length ?? 0} 个库位，合计 ${order.totalQuantity} 件。`,
      '🎉 拣货完成',
      {
        confirmButtonText: '完成',
        type: 'success',
        center: true
      }
    )

    // 调用后端完成订单接口（将订单与所有明细置为 COMPLETED）
    const resp: any = await completePickingOrder(order.id)

    if (resp?.code === 200) {
      ElMessage.success(`订单 ${order.orderNo} 已完成`)
    } else {
      // 后端接口失败则尝试仅更新状态
      await updatePickingOrderStatus(order.id, 'COMPLETED')
      ElMessage.success(`订单 ${order.orderNo} 已完成`)
    }

    order.status = 'COMPLETED'
    currentOrder.value = null

    // 刷新订单列表
    await loadOrderList()
  } catch (error: any) {
    // 用户关闭弹窗或后端失败
    if (error !== 'cancel') {
      globalErrorMsg.value = error?.message || '更新订单状态失败'
    }
  }
}

// ==================== 初始化 ====================

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped>
.picking-container {
  padding: 20px;
}

.picking-card {
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

/* ===== 分区 ===== */
.section {
  margin: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--wms-text);
  margin: 0 0 16px 0;
  padding-left: 10px;
  border-left: 3px solid var(--wms-primary);
}

/* 加载中 */
.loading-box {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

/* ===== 订单详情头部 ===== */
.order-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.order-info-header .section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-no-tag {
  margin-left: 4px;
}

/* 进度条 */
.order-progress {
  flex-shrink: 0;
}

/* ===== 当前待拣提示 ===== */
.current-target-alert {
  margin-bottom: 16px;
}

.current-target {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  line-height: 1.6;
}

.target-label {
  font-weight: 600;
  color: var(--el-color-warning);
}

.target-divider {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.target-qty {
  font-weight: 600;
  color: var(--el-color-primary);
}

/* ===== 条码扫描区 ===== */
.scan-area {
  margin-bottom: 16px;
}

/* 当前待拣行高亮 */
:deep(.current-target-row) {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  background-color: var(--el-color-warning-light-9);
}

:deep(.current-target-row:hover > td) {
  background-color: var(--el-color-warning-light-8) !important;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .picking-container {
    padding: 12px;
  }

  .card-title {
    font-size: 18px;
  }

  .order-info-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
