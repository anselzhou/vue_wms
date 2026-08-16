<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Refresh, Check } from '@element-plus/icons-vue'
import { getMaterialInfo } from '@/api/material'
import { insertBatch, type InventoryItem } from '@/api/inbound'

// ============================================================
// 类型定义
// ============================================================

/**
 * 入库缓存暂存位明细（前端暂存，提交时映射为后端 Inventory 契约）
 *
 * 合并键：`position + material + batch`（批次为空时按空字符串归并）。
 * 相同合并键的多次扫码会累加数量，不同合并键则新增一行。
 */
interface InboundCacheItem {
  /** 库位 */
  position: string
  /** 物料编码 */
  material: string
  /** EAN 码（来自物料主数据） */
  ean: string
  /** 物料描述 */
  description: string
  /** 批次（前端暂存分组字段，后端 inventory 表无批次列，提交时不携带） */
  batch: string
  /** 数量 */
  quantity: number
}

// ============================================================
// 常量
// ============================================================

/** 暂存位最大条目数，防止内存无限增长并避免一次提交过大 */
const MAX_CACHE_SIZE = 200
/** 物料编码合法字符：字母、数字、连字符、下划线、点、斜杠 */
const BARCODE_PATTERN = /^[A-Za-z0-9\-_./]+$/
/** 两段式入库：所有入库货物统一先写入此暂存库位 */
const INBOUND_STAGING_POSITION = '入库暂存位'

// ============================================================
// 表单状态
// ============================================================

const materialCode = ref('')
const batch = ref('')
const defaultQuantity = ref(1)

/** 暂存位明细 */
const cacheItems = ref<InboundCacheItem[]>([])

/** 添加物料进行中（防重复扫码触发重复查询） */
const isAdding = ref(false)
/** 提交进行中（防重复提交） */
const isSubmitting = ref(false)

const materialInputRef = ref()

// ============================================================
// 派生状态
// ============================================================

/** 暂存位是否已满 */
const isCacheFull = computed(() => cacheItems.value.length >= MAX_CACHE_SIZE)

/** 暂存件数合计 */
const totalQuantity = computed(() =>
  cacheItems.value.reduce((sum, item) => sum + item.quantity, 0)
)

// ============================================================
// 工具函数
// ============================================================

/** 计算暂存位合并键 */
const buildMergeKey = (position: string, material: string, batch: string): string =>
  `${position.trim()}|${material.trim()}|${(batch ?? '').trim()}`

/** 校验物料编码格式，返回错误文案（空字符串表示合法） */
const validateBarcode = (value: string): string => {
  const code = value.trim()
  if (!code) return '请输入物料编码'
  if (code.length > 64) return '物料编码长度不能超过 64 个字符'
  if (!BARCODE_PATTERN.test(code)) return '物料编码格式非法，仅支持字母、数字及 -_./ 字符'
  return ''
}

// ============================================================
// 交互逻辑
// ============================================================

/** 扫描/添加物料到暂存位 */
const handleAddMaterial = async () => {
  // 防重复触发：扫码枪连续回车时避免并发重复查询
  if (isAdding.value) return

  // 两段式入库：固定写入「入库暂存位」
  const pos = INBOUND_STAGING_POSITION
  const code = materialCode.value.trim()
  const batchValue = batch.value.trim()

  // 1. 物料编码校验（空码 / 非法条码）
  const barcodeError = validateBarcode(materialCode.value)
  if (barcodeError) {
    ElMessage.warning(barcodeError)
    materialInputRef.value?.focus()
    return
  }

  // 2. 数量校验
  const qty = Math.floor(defaultQuantity.value)
  if (!Number.isFinite(qty) || qty < 1) {
    ElMessage.warning('请输入有效数量（大于 0 的整数）')
    return
  }

  // 3. 暂存位满载校验
  if (isCacheFull.value) {
    ElMessage.error(`入库缓存暂存位已满（上限 ${MAX_CACHE_SIZE} 条），请先提交或清空`)
    return
  }

  isAdding.value = true
  try {
    // 4. 查询物料主数据（后端返回数组，取第一条精确匹配）
    const res = await getMaterialInfo(code)
    const list = Array.isArray(res?.data) ? res.data : []
    const material = list.find(m => m.material === code) ?? list[0]

    if (!material) {
      ElMessage.error(`物料编码 "${code}" 不存在，请检查条码后重新扫描`)
      return
    }

    // 5. 写入暂存位：相同合并键累加，否则新增
    const mergeKey = buildMergeKey(pos, material.material, batchValue)
    const existing = cacheItems.value.find(
      item => buildMergeKey(item.position, item.material, item.batch) === mergeKey
    )

    if (existing) {
      existing.quantity += qty
      existing.description = material.description || existing.description
      existing.ean = material.ean || existing.ean
      ElMessage.success(
        `已合并：${material.description || material.material}，当前累计 ${existing.quantity} 件`
      )
    } else {
      cacheItems.value.push({
        position: pos,
        material: material.material,
        ean: material.ean || '',
        description: material.description || '',
        batch: batchValue,
        quantity: qty
      })
      ElMessage.success(`已写入暂存位：${material.description || material.material} x ${qty}`)
    }

    // 6. 清空扫描输入，聚焦物料框以便连续扫码
    materialCode.value = ''
    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    const message = error?.message || error?.response?.data?.message
    ElMessage.error(message || '查询物料失败，请稍后重试')
  } finally {
    isAdding.value = false
  }
}

/** 删除暂存位单行 */
const handleDelete = (index: number) => {
  const item = cacheItems.value[index]
  if (!item) return

  ElMessageBox.confirm(
    `确定要删除 "${item.description || item.material}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      cacheItems.value.splice(index, 1)
      ElMessage.success('删除成功')
    })
    .catch(() => {
      /* 用户取消，忽略 */
    })
}

/** 清空暂存位 */
const handleClear = () => {
  if (cacheItems.value.length === 0) return

  ElMessageBox.confirm(
    `确定要清空暂存位中的 ${cacheItems.value.length} 条明细吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      cacheItems.value = []
      ElMessage.success('已清空暂存位')
    })
    .catch(() => {
      /* 用户取消，忽略 */
    })
}

/** 提交入库 */
const handleSubmit = async () => {
  // 防重复提交
  if (isSubmitting.value) return

  if (cacheItems.value.length === 0) {
    ElMessage.warning('暂存位为空，请先扫描物料')
    return
  }

  // 提交前对暂存位按合并键再次归并，确保不出现重复键
  const mergedMap = new Map<string, InventoryItem>()
  for (const item of cacheItems.value) {
    const key = buildMergeKey(item.position, item.material, item.batch)
    const existing = mergedMap.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      mergedMap.set(key, {
        position: item.position,
        material: item.material,
        quantity: item.quantity,
        ean: item.ean || ''
      })
    }
  }
  const inventoryItems = Array.from(mergedMap.values())

  isSubmitting.value = true
  try {
    await insertBatch(inventoryItems)
    ElMessage.success({
      message: `入库成功！共 ${inventoryItems.length} 种物料，合计 ${inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )} 件`,
      duration: 3000
    })

    // 成功后清空暂存位与输入
    cacheItems.value = []
    materialCode.value = ''
    batch.value = ''
    await nextTick()
    materialInputRef.value?.focus()
  } catch (error: any) {
    const message = error?.message || error?.response?.data?.message
    ElMessage.error(message || '入库失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="inbound-container">
    <el-card class="inbound-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">入库管理</h2>
          <el-tag type="success" size="large">
            暂存 {{ cacheItems.length }} 条 / {{ totalQuantity }} 件
          </el-tag>
        </div>
      </template>

      <!-- 输入区域 -->
      <div class="input-section">
        <el-form label-position="top" size="large" @submit.prevent>
          <el-form-item label="入库库位">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              title="入库暂存位"
            >
              所有入库货物统一先写入「入库暂存位」，再通过「物料上架」搬移到正式库位。
            </el-alert>
          </el-form-item>

          <div class="input-row">
            <el-form-item label="物料编码" class="grow">
              <el-input
                ref="materialInputRef"
                v-model="materialCode"
                placeholder="扫描/输入物料编码，回车写入暂存位"
                clearable
                :prefix-icon="Search"
                @keyup.enter="handleAddMaterial"
              />
            </el-form-item>

            <el-form-item label="批次" class="batch">
              <el-input
                v-model="batch"
                placeholder="选填：批次号"
                clearable
                @keyup.enter="handleAddMaterial"
              />
            </el-form-item>

            <el-form-item label="数量" class="qty">
              <el-input-number
                v-model="defaultQuantity"
                :min="1"
                :max="999999"
                :step="1"
                controls-position="right"
                @keyup.enter="handleAddMaterial"
              />
            </el-form-item>
          </div>

          <div class="action-row">
            <el-button
              type="primary"
              size="large"
              :icon="Plus"
              :loading="isAdding"
              @click="handleAddMaterial"
            >
              写入暂存位
            </el-button>
            <el-tag v-if="isCacheFull" type="danger" effect="dark">
              暂存位已满（{{ MAX_CACHE_SIZE }} 条），请先提交或清空
            </el-tag>
          </div>
        </el-form>
      </div>

      <!-- 暂存位明细表格 -->
      <div class="table-section">
        <el-table
          :data="cacheItems"
          stripe
          border
          style="width: 100%"
          max-height="420"
          empty-text="暂存位为空，请扫描物料编码"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--wms-text-secondary)'
          }"
        >
          <el-table-column type="index" label="序号" width="70" align="center" />

          <el-table-column prop="position" label="库位" min-width="120">
            <template #default="{ row }">
              <el-tag type="info">{{ row.position }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="material" label="物料编码" min-width="160">
            <template #default="{ row }">
              <el-tag type="info">{{ row.material }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="ean" label="EAN码" width="150">
            <template #default="{ row }">{{ row.ean || '-' }}</template>
          </el-table-column>

          <el-table-column prop="description" label="物料描述" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '-' }}</template>
          </el-table-column>

          <el-table-column prop="batch" label="批次" width="130" align="center">
            <template #default="{ row }">
              {{ row.batch || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="quantity" label="数量" width="110" align="center">
            <template #default="{ row }">
              <el-tag type="success" effect="plain">{{ row.quantity }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-section">
        <el-button
          type="warning"
          size="large"
          :icon="Refresh"
          @click="handleClear"
          :disabled="cacheItems.length === 0"
        >
          清空暂存位
        </el-button>

        <el-button
          type="success"
          size="large"
          :icon="Check"
          @click="handleSubmit"
          :disabled="cacheItems.length === 0 || isSubmitting"
          :loading="isSubmitting"
        >
          {{ isSubmitting ? '提交中...' : '提交入库' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.inbound-container {
  padding: 20px;
}

.inbound-card {
  border-radius: var(--wms-radius);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--wms-text);
}

.input-section {
  padding: 8px 0 20px;
  border-bottom: 1px solid var(--wms-border);
}

.input-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.input-row .grow {
  flex: 1;
}

.input-row .batch {
  width: 200px;
}

.input-row .qty {
  width: 180px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-section {
  margin: 20px 0;
  min-height: 200px;
}

.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--wms-border);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .inbound-container {
    padding: 12px;
  }

  .input-row {
    flex-direction: column;
    gap: 0;
  }

  .input-row .batch,
  .input-row .qty {
    width: 100%;
  }

  .action-section {
    flex-direction: column;
  }

  .action-section .el-button {
    width: 100%;
  }
}
</style>
