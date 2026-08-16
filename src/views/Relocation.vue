<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Switch, Right } from '@element-plus/icons-vue'
import ToggleLockButton from '@/components/ToggleLockButton.vue'
import {
  relocate,
  locationReset,
  queryMaterialStock,
  type RelocationRequest,
  type MaterialPositionInfo
} from '@/api/inventory'

type RelocationMode = 'material' | 'location'

const mode = ref<RelocationMode>('material')

// ============================================================
// 物料移库
// ============================================================
const fromPosition = ref('')
const toPosition = ref('')
const materialCode = ref('')
const quantity = ref<number | undefined>(undefined)

const isFromLocked = ref(false)
const isToLocked = ref(false)
const isSingleMode = ref(false)

const isLoading = ref(false)
const stockLoading = ref(false)
const stockList = ref<MaterialPositionInfo[]>([])
const stockQueried = ref(false)

const toInputRef = ref()
const materialInputRef = ref()
const quantityInputRef = ref()

// 库位重置
const resetFromPosition = ref('')
const resetToPosition = ref('')
const resetFromInputRef = ref()
const resetToInputRef = ref()
const isResetLoading = ref(false)

const toggleSingleMode = () => {
  if (isSingleMode.value) {
    quantity.value = 1
    ElMessage.success('逐件模式已开启，无需输入数量')
  } else {
    quantity.value = undefined
    ElMessage.info('逐件模式已关闭，需要输入数量')
  }
}

const toggleFromLock = () => {
  if (isFromLocked.value) {
    ElMessage.success('锁定原库位')
  } else {
    // 解锁原库位时清空原库位文本框
    fromPosition.value = ''
    ElMessage.info('原库位已解锁')
  }
}

const toggleToLock = () => {
  if (isToLocked.value) {
    ElMessage.success('锁定目标库位')
  } else {
    // 解锁目标库位时清空目标库位文本框
    toPosition.value = ''
    ElMessage.info('目标库位已解锁')
  }
}

/** 查询物料在各库位的库存并高亮原库位 */
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
    await handleRelocate()
  } else {
    quantityInputRef.value?.focus()
  }
}

/** 提交物料移库 */
const handleRelocate = async () => {
  const from = fromPosition.value.trim()
  const to = toPosition.value.trim()
  const material = materialCode.value.trim()

  if (!from) {
    ElMessage.warning('请输入原库位')
    return
  }
  if (!to) {
    ElMessage.warning('请输入目标库位')
    return
  }
  if (from === to) {
    ElMessage.warning('原库位与目标库位不能相同')
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

  // 确保库存已加载：若尚未查询到原库位记录，则先查询
  let stockRow = stockList.value.find(r => r.position === from)
  if (!stockRow) {
    await loadStock()
    stockRow = stockList.value.find(r => r.position === from)
  }

  if (!stockRow) {
    ElMessage.error('原库位无该物料的库存记录，无法移库')
    return
  }
  if (submitQty! > stockRow.availableQuantity) {
    ElMessage.error(`原库位可用库存不足，当前可用 ${stockRow.availableQuantity} 件`)
    return
  }

  const payload: RelocationRequest = {
    fromPosition: from,
    toPosition: to,
    material,
    quantity: submitQty!
  }

  try {
    isLoading.value = true
    await relocate(payload)
    ElMessage.success(`移库成功：${material} x ${submitQty}`)

    // 成功后清空物料编码与数量，保留库位（除非未锁定则一并清空）
    materialCode.value = ''
    stockList.value = []
    stockQueried.value = false
    if (!isSingleMode.value) {
      quantity.value = undefined
    }
    if (!isFromLocked.value) {
      fromPosition.value = ''
    }
    if (!isToLocked.value) {
      toPosition.value = ''
    }

    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '移库失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

/** 库位重置二次确认与提交 */
const handleLocationReset = async () => {
  const from = resetFromPosition.value.trim()
  const to = resetToPosition.value.trim()

  if (!from) {
    ElMessage.warning('请输入原库位')
    return
  }
  if (!to) {
    ElMessage.warning('请输入目标库位')
    return
  }
  if (from === to) {
    ElMessage.warning('原库位与目标库位不能相同')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定将原库位「${from}」的全部物料搬到目标库位「${to}」吗？`,
      '库位重置确认',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    // 用户取消
    return
  }

  try {
    isResetLoading.value = true
    await locationReset(from, to)
    ElMessage.success(`库位重置成功：${from} → ${to}`)
    resetFromPosition.value = ''
    resetToPosition.value = ''
    await nextTick()
    resetFromInputRef.value?.focus()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '库位重置失败，请稍后重试')
  } finally {
    isResetLoading.value = false
  }
}

const tableRowClassName = ({ row }: { row: MaterialPositionInfo }) => {
  return row.position === fromPosition.value.trim() ? 'highlight-row' : ''
}

const originalAvailable = computed(() => {
  const row = stockList.value.find(r => r.position === fromPosition.value.trim())
  return row?.availableQuantity ?? 0
})

const route = useRoute()

// 从库存查询页跳转过来时，预填原库位与物料编码
onMounted(() => {
  const pos = typeof route.query.position === 'string' ? route.query.position : ''
  const mat = typeof route.query.material === 'string' ? route.query.material : ''
  if (pos) {
    fromPosition.value = pos
  }
  if (mat) {
    materialCode.value = mat
    loadStock()
  }
})
</script>

<template>
  <div class="relocation-container">
    <el-card class="relocation-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">移库管理</h2>
          <el-radio-group v-model="mode" size="large">
            <el-radio-button value="material">
              <el-icon><Switch /></el-icon>
              物料移库
            </el-radio-button>
            <el-radio-button value="location">
              <el-icon><Right /></el-icon>
              库位重置
            </el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- 物料移库 -->
      <el-form v-if="mode === 'material'" label-position="top" size="large" @submit.prevent>
        <el-form-item label="原库位">
          <el-input
            v-model="fromPosition"
            placeholder="请输入原库位"
            clearable
            @keyup.enter="toInputRef?.focus()"
          >
            <template #append>
              <ToggleLockButton
                v-model="isFromLocked"
                inactive-text=""
                active-text=""
                @click="toggleFromLock"
              />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="目标库位">
          <el-input
            ref="toInputRef"
            v-model="toPosition"
            placeholder="请输入目标库位"
            clearable
            @keyup.enter="materialInputRef?.focus()"
          >
            <template #append>
              <ToggleLockButton
                v-model="isToLocked"
                inactive-text=""
                active-text=""
                @click="toggleToLock"
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
            @keyup.enter="handleRelocate"
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
              <el-tag v-if="fromPosition" type="success" effect="plain">
                原库位可用：{{ originalAvailable }} 件
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
                <el-tag :type="row.position === fromPosition.trim() ? 'success' : 'info'">
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
            @click="handleRelocate"
          >
            确认移库
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 库位重置 -->
      <el-form v-else label-position="top" size="large" @submit.prevent>
        <el-alert
          class="reset-tip"
          type="warning"
          :closable="false"
          show-icon
          title="库位重置会将原库位下的全部物料搬到目标库位，请谨慎操作"
        />

        <el-form-item label="原库位">
          <el-input
            ref="resetFromInputRef"
            v-model="resetFromPosition"
            placeholder="请输入原库位"
            clearable
            @keyup.enter="resetToInputRef?.focus()"
          />
        </el-form-item>

        <el-form-item label="目标库位">
          <el-input
            ref="resetToInputRef"
            v-model="resetToPosition"
            placeholder="请输入目标库位"
            clearable
            @keyup.enter="handleLocationReset"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="danger"
            size="large"
            class="submit-btn"
            :loading="isResetLoading"
            @click="handleLocationReset"
          >
            确认库位重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.relocation-container {
  padding: 20px;
}

.relocation-card {
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

.reset-tip {
  margin-bottom: 18px;
}

/* 高亮原库位行 */
:deep(.highlight-row) {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  font-weight: 600;
}

@media (max-width: 768px) {
  .relocation-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
