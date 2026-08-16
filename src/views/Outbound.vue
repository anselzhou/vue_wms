<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import ToggleLockButton from '@/components/ToggleLockButton.vue'
import { queryMaterialStock, type MaterialPositionInfo } from '@/api/inventory'
import { submitOutbound, type OutboundRequest } from '@/api/outbound'

// ============================================================
// 出库表单状态
// ============================================================
const position = ref('')
const materialCode = ref('')
const quantity = ref<number | undefined>(undefined)
const remark = ref('')

const isPositionLocked = ref(false)
const isSingleMode = ref(false)

const isLoading = ref(false)
const stockLoading = ref(false)
const stockList = ref<MaterialPositionInfo[]>([])
const stockQueried = ref(false)

const materialInputRef = ref()
const quantityInputRef = ref()

/** 切换逐件/批量模式 */
const toggleSingleMode = () => {
  if (isSingleMode.value) {
    quantity.value = 1
    ElMessage.success('逐件模式已开启，无需输入数量')
  } else {
    quantity.value = undefined
    ElMessage.info('逐件模式已关闭，需要输入数量')
  }
}

/** 切换库位锁定 */
const togglePositionLock = () => {
  if (isPositionLocked.value) {
    ElMessage.success('锁定库位')
  } else {
    position.value = ''
    ElMessage.info('库位已解锁')
  }
}

/** 查询物料在各库位的库存并高亮当前库位 */
const loadStock = async () => {
  const kw = materialCode.value.trim()
  if (!kw) return

  stockLoading.value = true
  try {
    const res = await queryMaterialStock(kw)
    stockList.value = Array.isArray(res?.data) ? res.data : []
    stockQueried.value = true
    if (stockList.value.length === 0) {
      ElMessage.info('该物料暂无库存记录')
    } else {
      ElMessage.success(`查询成功，该物料共 ${stockList.value.length} 个库位`)
    }
  } catch {
    stockList.value = []
  } finally {
    stockLoading.value = false
  }
}

/** 物料编码回车：查询库存，逐件模式直接提交，否则聚焦数量 */
const handleMaterialEnter = async () => {
  await loadStock()
  if (isSingleMode.value) {
    await handleOutbound()
  } else {
    quantityInputRef.value?.focus()
  }
}

/** 提交出库 */
const handleOutbound = async () => {
  const pos = position.value.trim()
  const material = materialCode.value.trim()

  if (!pos) {
    ElMessage.warning('请输入库位')
    return
  }
  if (!material) {
    ElMessage.warning('请输入物料编码')
    return
  }

  const submitQty = isSingleMode.value ? 1 : quantity.value
  if (!isSingleMode.value && (!submitQty || submitQty <= 0)) {
    ElMessage.warning('请输入有效数量')
    return
  }

  // 确保库存已加载：若尚未查询到该库位记录，则先查询
  let stockRow = stockList.value.find(r => r.position === pos)
  if (!stockRow) {
    await loadStock()
    stockRow = stockList.value.find(r => r.position === pos)
  }

  if (!stockRow) {
    ElMessage.error('该库位无此物料的库存记录，无法出库')
    return
  }
  if (submitQty! > stockRow.availableQuantity) {
    ElMessage.error(`该库位可用库存不足，当前可用 ${stockRow.availableQuantity} 件`)
    return
  }

  const payload: OutboundRequest = {
    position: pos,
    material,
    quantity: submitQty!,
    remark: remark.value.trim() || undefined
  }

  try {
    isLoading.value = true
    await submitOutbound(payload)
    ElMessage.success(`出库成功：${material} x ${submitQty}`)

    // 成功后清空物料编码与数量，保留库位（除非未锁定则一并清空）
    materialCode.value = ''
    stockList.value = []
    stockQueried.value = false
    remark.value = ''
    if (!isSingleMode.value) {
      quantity.value = undefined
    }
    if (!isPositionLocked.value) {
      position.value = ''
    }

    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '出库失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const tableRowClassName = ({ row }: { row: MaterialPositionInfo }) => {
  return row.position === position.value.trim() ? 'highlight-row' : ''
}

const currentAvailable = computed(() => {
  const row = stockList.value.find(r => r.position === position.value.trim())
  return row?.availableQuantity ?? 0
})

const route = useRoute()

// 从库存查询页跳转过来时，预填库位与物料编码
onMounted(() => {
  const pos = typeof route.query.position === 'string' ? route.query.position : ''
  const mat = typeof route.query.material === 'string' ? route.query.material : ''
  if (pos) {
    position.value = pos
  }
  if (mat) {
    materialCode.value = mat
    loadStock()
  }
})
</script>

<template>
  <div class="outbound-container">
    <el-card class="outbound-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">出库管理</h2>
          <el-tag type="danger" effect="plain">扫描库位与物料编码，扣减库存</el-tag>
        </div>
      </template>

      <el-form label-position="top" size="large" @submit.prevent>
        <el-form-item label="库位">
          <el-input
            v-model="position"
            placeholder="请输入库位"
            clearable
            @keyup.enter="materialInputRef?.focus()"
          >
            <template #append>
              <ToggleLockButton
                v-model="isPositionLocked"
                inactive-text=""
                active-text=""
                @click="togglePositionLock"
              />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="物料编码">
          <el-input
            ref="materialInputRef"
            v-model="materialCode"
            placeholder="请输入物料编码"
            clearable
            @keyup.enter="handleMaterialEnter"
            @blur="loadStock"
          >
            <template #append>
              <ToggleLockButton
                v-model="isSingleMode"
                inactive-text=""
                active-text=""
                @click="toggleSingleMode"
              />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="!isSingleMode" label="数量">
          <el-input
            ref="quantityInputRef"
            v-model.number="quantity"
            type="number"
            placeholder="请输入数量"
            clearable
            @keyup.enter="handleOutbound"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="remark"
            placeholder="选填：出库备注"
            clearable
          />
        </el-form-item>

        <!-- 库存预览 -->
        <div v-if="stockQueried && stockList.length > 0" class="stock-section">
          <div class="stock-header">
            <h3 class="stock-title">
              <el-icon><Search /></el-icon>
              库存分布
            </h3>
            <div class="stock-actions">
              <el-tag v-if="position" type="success" effect="plain">
                当前库位可用：{{ currentAvailable }} 件
              </el-tag>
              <el-button
                size="small"
                :icon="Refresh"
                :loading="stockLoading"
                @click="loadStock"
              >
                刷新
              </el-button>
            </div>
          </div>

          <el-table
            :data="stockList"
            stripe
            border
            v-loading="stockLoading"
            style="width: 100%"
            max-height="320"
            :row-class-name="tableRowClassName"
            :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)' }"
            empty-text="暂无库存数据"
          >
            <el-table-column prop="position" label="库位" min-width="140">
              <template #default="{ row }">
                <el-tag :type="row.position === position.trim() ? 'success' : 'info'">
                  {{ row.position }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="material" label="物料编码" min-width="140">
              <template #default="{ row }">
                {{ row.material || '-' }}
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

        <el-form-item v-if="!isSingleMode">
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="isLoading"
            @click="handleOutbound"
          >
            确认出库
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.outbound-container {
  padding: 20px;
}

.outbound-card {
  border-radius: var(--wms-radius);
  max-width: 760px;
  margin: 0 auto;
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

.submit-btn {
  width: 100%;
}

.stock-section {
  margin-bottom: 18px;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.stock-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--wms-text);
}

.stock-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 高亮当前库位行 */
:deep(.highlight-row) {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  font-weight: 600;
}

@media (max-width: 768px) {
  .outbound-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
