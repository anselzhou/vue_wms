<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import ToggleLockButton from '@/components/ToggleLockButton.vue'
import { relocate, queryMaterialStock, type MaterialPositionInfo } from '@/api/inventory'
import { playCorrect, playError } from '@/utils/sound'

/** 两段式上架：来源库位固定为「入库暂存位」 */
const INBOUND_STAGING_POSITION = '入库暂存位'

const location = ref('')
const materialCode = ref('')
const quantity = ref<number | undefined>(undefined)
const isLocked = ref(false)
const isSingleMode = ref(false)
const isLoading = ref(false)
const stockLoading = ref(false)
const materialInputRef = ref()

/** 该物料在「入库暂存位」的库存记录（用于数量校验与提示） */
const stagingStock = ref<MaterialPositionInfo | null>(null)

/** 暂存位可用库存 */
const stagingAvailable = computed(() => stagingStock.value?.availableQuantity ?? 0)

const toggleSingleMode = () => {
  if (isSingleMode.value) {
    quantity.value = 1
    ElMessage.success('逐件模式已开启，无需输入数量')
  } else {
    quantity.value = undefined
    ElMessage.info('逐件模式已关闭，需要输入数量')
  }
}

const toggleLockLocation = () => {
  if (isLocked.value) {
    ElMessage.success('锁定库位')
  } else {
    // 解锁库位时清空库位文本框
    location.value = ''
    ElMessage.info('库位已解锁')
  }
}

/** 查询该物料在入库暂存位的库存（静默，不播放音效，由调用方控制） */
const loadStagingStock = async (material: string) => {
  stagingStock.value = null
  if (!material) return false

  stockLoading.value = true
  try {
    const res = await queryMaterialStock(material)
    const list = Array.isArray(res?.data) ? (res.data as MaterialPositionInfo[]) : []
    stagingStock.value = list.find(r => r.position === INBOUND_STAGING_POSITION) ?? null
    return true
  } catch {
    stagingStock.value = null
    return false
  } finally {
    stockLoading.value = false
  }
}

/** 物料编码回车：查询暂存位库存，逐件模式直接上架，否则聚焦数量 */
const handleMaterialEnter = async () => {
  const material = materialCode.value.trim()
  if (!material) {
    playError()
    materialInputRef.value?.focus()
    return
  }
  const ok = await loadStagingStock(material)
  if (isSingleMode.value) {
    // 单件模式直接上架，音效由 handleSubmit 负责
    await handleSubmit()
  } else {
    if (ok) {
      playCorrect()
      // 非逐件模式聚焦数量输入
      const qtyInput = document.querySelector<HTMLInputElement>('.putaway-qty input')
      qtyInput?.focus()
    } else {
      playError()
    }
  }
}

/** 提交上架请求：从入库暂存位移库到正式库位 */
const handleSubmit = async () => {
  // 校验目标库位不能为空
  if (!location.value.trim()) {
    ElMessage.warning('请输入目标库位')
    playError()
    return
  }
  if (location.value.trim() === INBOUND_STAGING_POSITION) {
    ElMessage.warning('目标库位不能是「入库暂存位」，请选择正式库位')
    playError()
    return
  }
  // 校验物料编码不能为空
  const material = materialCode.value.trim()
  if (!material) {
    ElMessage.warning('请输入物料编码')
    playError()
    return
  }

  // 逐件模式下数量固定为1，否则使用用户输入的数量
  const submitQty = isSingleMode.value ? 1 : quantity.value

  // 非逐件模式下需要校验数量有效性
  if (!isSingleMode.value && (!submitQty || submitQty <= 0)) {
    ElMessage.warning('请输入有效数量')
    playError()
    return
  }

  // 校验暂存位库存是否充足（若尚未加载则先查询）
  if (!stagingStock.value || stagingStock.value.material !== material) {
    await loadStagingStock(material)
  }
  if (!stagingStock.value) {
    ElMessage.error('「入库暂存位」无该物料的库存记录，无法上架')
    playError()
    return
  }
  if (submitQty! > stagingAvailable.value) {
    ElMessage.error(`「入库暂存位」可用库存不足，当前可用 ${stagingAvailable.value} 件`)
    playError()
    return
  }

  try {
    isLoading.value = true
    // 调用移库接口：入库暂存位 → 正式库位
    await relocate({
      fromPosition: INBOUND_STAGING_POSITION,
      toPosition: location.value.trim(),
      material,
      quantity: submitQty!
    })
    ElMessage.success(`上架成功：${material} x ${submitQty} → ${location.value.trim()}`)
    playCorrect()
    // 上架成功后清空物料编码与暂存位缓存
    materialCode.value = ''
    stagingStock.value = null
    // 非逐件模式下同时清空数量
    if (!isSingleMode.value) {
      quantity.value = undefined
    }
    // 未锁定库位时清空库位，便于更换库位继续上架；锁定时保留库位
    if (!isLocked.value) {
      location.value = ''
    }
    // 等待DOM更新后自动聚焦到物料编码输入框，方便连续扫码上架
    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    // 优先展示后端返回的错误信息，否则展示默认提示
    ElMessage.error(error?.response?.data?.message || error?.message || '上架失败，请稍后重试')
    playError()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="putaway-container">
    <el-card class="putaway-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">物料上架</h2>
          <el-tag type="info" size="small">来源：{{ INBOUND_STAGING_POSITION }}</el-tag>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="staging-tip"
        title="两段式上架"
        description="货物先从「入库暂存位」搬移到正式库位，提交后暂存位库存同步扣减。"
      />

      <el-form label-position="top" size="large" @submit.prevent>
        <el-form-item label="目标库位">
          <el-input
            v-model="location"
            placeholder="请输入正式库位"
            clearable
            @keyup.enter="materialInputRef?.focus()"
          >
            <template #append>
              <ToggleLockButton
                  v-model="isLocked"
                  inactive-text=""
                  active-text=""
                  @click="toggleLockLocation">
              </ToggleLockButton>
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
              @click="toggleSingleMode">
              </ToggleLockButton>
            </template>
          </el-input>
        </el-form-item>

        <!-- 暂存位库存提示 -->
        <el-form-item v-if="materialCode.trim()">
          <div class="stock-hint" v-loading="stockLoading">
            <template v-if="stagingStock">
              <span class="hint-label">暂存位可用：</span>
              <el-tag :type="stagingAvailable > 0 ? 'success' : 'danger'" effect="plain">
                {{ stagingAvailable }} 件
              </el-tag>
            </template>
            <span v-else-if="!stockLoading" class="hint-empty">
              暂存位无该物料库存
            </span>
          </div>
        </el-form-item>

        <el-form-item v-if="!isSingleMode" label="数量" class="putaway-qty">
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
            确认上架
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.putaway-container {
  padding: 20px;
}

.putaway-card {
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
  .putaway-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
