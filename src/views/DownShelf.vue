<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ToggleLockButton from '@/components/ToggleLockButton.vue'
import { relocate, queryMaterialStock, type MaterialPositionInfo } from '@/api/inventory'

/** 两段式下架：目标库位固定为「普通暂存位」 */
const NORMAL_STAGING_POSITION = '普通暂存位'

const position = ref('')
const materialCode = ref('')
const quantity = ref<number | undefined>(undefined)
const isLocked = ref(false)
const isSingleMode = ref(false)
const isLoading = ref(false)
const stockLoading = ref(false)
const positionInputRef = ref()
const materialInputRef = ref()

/** 该物料在来源库位的库存记录（用于数量校验与提示） */
const sourceStock = ref<MaterialPositionInfo | null>(null)

/** 来源库位可用库存 */
const sourceAvailable = computed(() => sourceStock.value?.availableQuantity ?? 0)

const toggleSingleMode = () => {
  if (isSingleMode.value) {
    quantity.value = 1
    ElMessage.success('逐件模式已开启，无需输入数量')
  } else {
    quantity.value = undefined
    ElMessage.info('逐件模式已关闭，需要输入数量')
  }
}

const toggleLockPosition = () => {
  if (isLocked.value) {
    ElMessage.success('锁定来源库位')
  } else {
    // 解锁来源库位时清空库位文本框
    position.value = ''
    ElMessage.info('来源库位已解锁')
  }
}

/** 查询该物料在来源库位的库存 */
const loadSourceStock = async (material: string) => {
  sourceStock.value = null
  const pos = position.value.trim()
  if (!material || !pos) return

  stockLoading.value = true
  try {
    const res = await queryMaterialStock(material)
    const list = Array.isArray(res?.data) ? (res.data as MaterialPositionInfo[]) : []
    sourceStock.value = list.find(r => r.position === pos) ?? null
  } catch {
    sourceStock.value = null
  } finally {
    stockLoading.value = false
  }
}

/** 物料编码回车：查询来源库位库存，逐件模式直接下架，否则聚焦数量 */
const handleMaterialEnter = async () => {
  const material = materialCode.value.trim()
  if (!material) {
    materialInputRef.value?.focus()
    return
  }
  if (!position.value.trim()) {
    ElMessage.warning('请输入来源库位')
    positionInputRef.value?.focus()
    return
  }
  await loadSourceStock(material)
  if (isSingleMode.value) {
    await handleSubmit()
  } else {
    // 非逐件模式聚焦数量输入
    const qtyInput = document.querySelector<HTMLInputElement>('.downshelf-qty input')
    qtyInput?.focus()
  }
}

/** 提交下架请求：从正式库位移库到普通暂存位 */
const handleSubmit = async () => {
  const pos = position.value.trim()
  if (!pos) {
    ElMessage.warning('请输入来源库位')
    return
  }
  if (pos === NORMAL_STAGING_POSITION) {
    ElMessage.warning('来源库位不能是「普通暂存位」，请选择正式库位')
    return
  }

  const material = materialCode.value.trim()
  if (!material) {
    ElMessage.warning('请输入物料编码')
    return
  }

  // 逐件模式下数量固定为1，否则使用用户输入的数量
  const submitQty = isSingleMode.value ? 1 : quantity.value
  if (!isSingleMode.value && (!submitQty || submitQty <= 0)) {
    ElMessage.warning('请输入有效数量')
    return
  }

  // 校验来源库位库存是否充足（若尚未加载或库位/物料变化则重新查询）
  if (
    !sourceStock.value ||
    sourceStock.value.position !== pos ||
    sourceStock.value.material !== material
  ) {
    await loadSourceStock(material)
  }
  if (!sourceStock.value) {
    ElMessage.error(`「${pos}」无该物料的库存记录，无法下架`)
    return
  }
  if (submitQty! > sourceAvailable.value) {
    ElMessage.error(`「${pos}」可用库存不足，当前可用 ${sourceAvailable.value} 件`)
    return
  }

  try {
    isLoading.value = true
    // 调用移库接口：正式库位 → 普通暂存位
    await relocate({
      fromPosition: pos,
      toPosition: NORMAL_STAGING_POSITION,
      material,
      quantity: submitQty!
    })
    ElMessage.success(`下架成功：${material} x ${submitQty} → ${NORMAL_STAGING_POSITION}`)
    // 下架成功后清空物料编码与来源库存缓存
    materialCode.value = ''
    sourceStock.value = null
    // 非逐件模式下同时清空数量
    if (!isSingleMode.value) {
      quantity.value = undefined
    }
    // 未锁定库位时清空库位，便于更换库位继续下架；锁定时保留库位
    if (!isLocked.value) {
      position.value = ''
    }
    // 等待DOM更新后自动聚焦到物料编码输入框，方便连续扫码下架
    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '下架失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const route = useRoute()

// 从库存查询页跳转过来时，预填来源库位与物料编码
onMounted(() => {
  const pos = typeof route.query.position === 'string' ? route.query.position : ''
  const mat = typeof route.query.material === 'string' ? route.query.material : ''
  if (pos) {
    position.value = pos
  }
  if (mat) {
    materialCode.value = mat
    loadSourceStock(mat)
  }
})
</script>

<template>
  <div class="downshelf-container">
    <el-card class="downshelf-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">物料下架</h2>
          <el-tag type="info" size="small">目标：{{ NORMAL_STAGING_POSITION }}</el-tag>
        </div>
      </template>

      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="staging-tip"
        title="两段式下架"
        description="货物从正式库位搬移到「普通暂存位」，提交后原库位库存同步扣减。"
      />

      <el-form label-position="top" size="large" @submit.prevent>
        <el-form-item label="来源库位">
          <el-input
            ref="positionInputRef"
            v-model="position"
            placeholder="请输入正式库位"
            clearable
            @keyup.enter="materialInputRef?.focus()"
          >
            <template #append>
              <ToggleLockButton
                v-model="isLocked"
                inactive-text=""
                active-text=""
                @click="toggleLockPosition"
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

        <!-- 来源库位库存提示 -->
        <el-form-item v-if="materialCode.trim()">
          <div class="stock-hint" v-loading="stockLoading">
            <template v-if="sourceStock">
              <span class="hint-label">来源库位可用：</span>
              <el-tag :type="sourceAvailable > 0 ? 'success' : 'danger'" effect="plain">
                {{ sourceAvailable }} 件
              </el-tag>
            </template>
            <span v-else-if="!stockLoading" class="hint-empty">
              来源库位无该物料库存
            </span>
          </div>
        </el-form-item>

        <el-form-item v-if="!isSingleMode" label="数量" class="downshelf-qty">
          <el-input
            v-model.number="quantity"
            type="number"
            placeholder="请输入数量"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item v-if="!isSingleMode">
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="isLoading"
            @click="handleSubmit"
          >
            确认下架
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.downshelf-container {
  padding: 20px;
}

.downshelf-card {
  border-radius: var(--wms-radius);
  max-width: 600px;
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

.staging-tip {
  margin-bottom: 16px;
}

.stock-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.hint-label {
  color: var(--wms-text-secondary);
}

.hint-empty {
  color: var(--el-color-danger);
  font-size: 14px;
}

.submit-btn {
  width: 100%;
}

@media (max-width: 768px) {
  .downshelf-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
