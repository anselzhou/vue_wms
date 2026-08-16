<template>
  <div class="create-inbound-container">
    <el-card class="inbound-card" shadow="never">
      <!-- ==================== 顶部标题区 ==================== -->
      <template #header>
        <div class="card-header">
          <h2 class="card-title">创建入库订单</h2>
          <div class="header-actions">
            <input
              ref="excelInputRef"
              type="file"
              accept=".xlsx,.xls"
              hidden
              @change="handleExcelFileChange"
            />
            <el-button type="primary" plain :icon="Upload" @click="triggerExcelInput">
              导入 Excel 明细
            </el-button>
            <el-button type="primary" :icon="Download" @click="downloadTemplate" plain>
              下载导入模板
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

      <!-- ==================== 订单基本信息 ==================== -->
      <div class="section">
        <h3 class="section-title">订单信息</h3>
        <el-form :model="orderForm" label-width="90px" class="order-form">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="订单类型">
                <el-select
                  v-model="orderForm.orderType"
                  placeholder="请选择订单类型"
                  clearable
                  style="width: 100%"
                >
                  <el-option label="采购入库" value="采购入库" />
                  <el-option label="退货入库" value="退货入库" />
                  <el-option label="调拨入库" value="调拨入库" />
                  <el-option label="其他入库" value="其他入库" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="供应商">
                <el-input
                  v-model="orderForm.supplier"
                  placeholder="请输入供应商名称"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8">
              <el-form-item label="备注">
                <el-input
                  v-model="orderForm.remark"
                  placeholder="请输入备注信息"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <el-divider />

      <!-- ==================== 物料搜索区 ==================== -->
      <div class="section">
        <h3 class="section-title">添加物料明细</h3>
        <div class="material-search-area">
          <el-autocomplete
            v-model="searchKeyword"
            :fetch-suggestions="querySearchAsync"
            :trigger-on-focus="false"
            placeholder="请输入物料编码"
            :debounce="300"
            clearable
            style="flex: 1"
            value-key="material"
            @select="handleMaterialSelect"
            @keyup.enter="handleSearchEnter"
          >
            <template #default="{ item }">
              <div class="search-result-item">
                <el-tag size="small" type="info">{{ item.material }}</el-tag>
                <span class="search-desc">{{ item.description }}</span>
                <span class="search-meta">{{ item.brand }} / {{ item.color }} / {{ item.size }}</span>
              </div>
            </template>
          </el-autocomplete>
          <el-button type="primary" :icon="Search" @click="handleSearchEnter">
            搜索
          </el-button>
        </div>
      </div>

      <el-divider />

      <!-- ==================== 订单明细表格 ==================== -->
      <div class="section table-section">
        <div class="table-header">
          <h3 class="section-title">订单明细</h3>
          <el-tag v-if="tableData.length > 0" type="success" size="large">
            共 {{ tableData.length }} 条明细，合计 {{ totalQuantity }} 件
          </el-tag>
        </div>

        <el-table
          :data="tableData"
          stripe
          border
          style="width: 100%"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
          max-height="500"
        >
          <!-- 空状态 -->
          <template #empty>
            <div class="empty-state">
              <el-icon :size="48" color="var(--el-text-color-placeholder)"><Box /></el-icon>
              <p class="empty-text">暂无明细数据</p>
              <p class="empty-hint">请通过上方搜索框搜索物料编码添加，或点击“导入 Excel 明细”按钮批量导入</p>
            </div>
          </template>

          <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />

          <el-table-column prop="material" label="物料编码" width="130" fixed="left">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.material }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="ean" label="EAN码" width="150" />

          <el-table-column prop="brand" label="品牌" width="100" />

          <el-table-column prop="category" label="品类" width="100" />

          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />

          <el-table-column prop="color" label="颜色" width="80" />

          <el-table-column prop="size" label="尺码" width="80" />

          <el-table-column prop="season" label="季节" width="80" />

          <el-table-column label="数量" width="140" align="center">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="99999"
                size="small"
                controls-position="right"
                @change="handleQuantityChange($index)"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="70" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                circle
                @click="removeRow($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-divider />

      <!-- ==================== 行内校验错误提示 ==================== -->
      <el-alert
        v-if="validationErrors.length > 0"
        :title="`存在 ${validationErrors.length} 条数据校验未通过`"
        type="warning"
        show-icon
        :closable="false"
        class="validation-alert"
      >
        <ul class="error-list">
          <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
        </ul>
      </el-alert>

      <!-- ==================== 提交操作区 ==================== -->
      <div class="submit-section">
        <div class="submit-info">
          <span v-if="tableData.length === 0" class="info-text warning">
            <el-icon><WarningFilled /></el-icon>
            请先添加至少一条物料明细
          </span>
          <span v-else-if="validationErrors.length > 0" class="info-text warning">
            <el-icon><WarningFilled /></el-icon>
            请修正校验错误后再提交
          </span>
          <span v-else class="info-text success">
            <el-icon><CircleCheckFilled /></el-icon>
            表单验证通过，可以提交
          </span>
        </div>
        <el-button
          type="primary"
          size="large"
          :icon="Check"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitting ? '正在提交...' : '提交入库订单' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search,
  Download,
  Upload,
  Delete,
  Check,
  Box,
  WarningFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { createInboundOrder } from '@/api/inbound'
import type { CreateInboundOrderRequest, InboundOrderItemRequest } from '@/api/inbound'
import { getMaterialInfo } from '@/api/material'
import { getUserInfo } from '@/utils/setUserInfo'
import ExcelImporter from '@/utils/ExcelImporter'

const router = useRouter()

// ==================== 类型定义 ====================

/** 物料完整信息（来自 GET /material/info） */
interface MaterialFullInfo {
  brand: string
  material: string
  ean: string
  category: string
  description: string
  season: string
  color: string
  size: string
  price: number
}

/** 表格行数据 */
interface TableRow {
  material: string
  ean: string
  brand: string
  category: string
  description: string
  season: string
  color: string
  size: string
  price: number
  quantity: number
}

// ==================== 订单表单 ====================

const orderForm = ref({
  orderType: '采购入库',
  supplier: '',
  remark: ''
})

// ==================== 物料搜索 ====================

const searchKeyword = ref('')

/** 远程搜索物料（el-autocomplete fetch-suggestions 回调） */
const querySearchAsync = async (queryString: string, cb: (results: any[]) => void) => {
  if (!queryString || queryString.trim().length === 0) {
    cb([])
    return
  }

  try {
    const response = await getMaterialInfo(queryString.trim())
    // 后端契约：data 为数组，直接作为建议列表（补 value 字段）
    const list = Array.isArray(response?.data) ? response.data : []
    cb(list.map(item => ({ ...item, value: item.material })))
  } catch {
    // 搜索失败不弹错误，仅返回空建议
    cb([])
  }
}

/** 回车搜索 — 调用 getmaterialinfo 接口查询并添加到表格 */
const handleSearchEnter = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入物料编码')
    return
  }

  try {
    const response = await getMaterialInfo(keyword)
    // 后端契约：data 为数组，精确查询时返回单个元素的数组
    const list = Array.isArray(response?.data) ? response.data : []
    const material = list.find(m => m.material === keyword) ?? list[0]
    if (material) {
      // 查到物料，直接添加到表格
      addMaterialToTable(material as unknown as MaterialFullInfo)
      searchKeyword.value = ''
      ElMessage.success(`已添加物料：${material.description || material.material}`)
    } else {
      // 接口返回成功但无数据，视为物料编码错误
      ElMessage.warning('物料编码错误，请重新输入')
    }
  } catch (error: any) {
    // 查不到物料或接口异常时，统一提示物料编码错误
    ElMessage.warning('物料编码错误，请重新输入')
  }
}

/** 从 autocomplete 建议列表选择物料 */
const handleMaterialSelect = (item: MaterialFullInfo) => {
  if (!item || !item.material) {
    ElMessage.warning('无效的物料信息')
    return
  }

  addMaterialToTable(item)
  searchKeyword.value = ''
  ElMessage.success(`已添加物料：${item.description || item.material}`)
}

/** 将物料信息添加到明细表 */
const addMaterialToTable = (info: MaterialFullInfo) => {
  // 检查是否已存在相同物料编码
  const exists = tableData.value.find(row => row.material === info.material)
  if (exists) {
    ElMessage.warning(`物料编码 "${info.material}" 已存在于明细表中，请勿重复添加`)
    return
  }

  tableData.value.push({
    material: info.material,
    ean: info.ean || '',
    brand: info.brand || '',
    category: info.category || '',
    description: info.description || '',
    season: info.season || '',
    color: info.color || '',
    size: info.size || '',
    price: info.price || 0,
    quantity: 1,
  })
}

// ==================== 表格数据 ====================

const tableData = ref<TableRow[]>([])

/** 删除行 */
const removeRow = (index: number) => {
  tableData.value.splice(index, 1)
}

/** 数量变更校验 */
const handleQuantityChange = (index: number) => {
  const row = tableData.value[index]
  if (!row) return
  if (row.quantity == null || row.quantity < 1) {
    row.quantity = 1
  }
}

/** 合计数量 */
const totalQuantity = computed(() => {
  return tableData.value.reduce((sum, row) => sum + (row.quantity || 0), 0)
})

// ==================== 校验 ====================

/** 行级校验错误列表 */
const validationErrors = computed<string[]>(() => {
  const errors: string[] = []

  tableData.value.forEach((row, index) => {
    const line = index + 1
    if (!row.material || row.material.trim() === '') {
      errors.push(`第 ${line} 行：物料编码不能为空`)
    }
    if (!row.quantity || row.quantity < 1) {
      errors.push(`第 ${line} 行：数量必须大于 0`)
    }
  })

  return errors
})

/** 表格是否有数据且校验通过 */
const isFormValid = computed(() => {
  return tableData.value.length > 0 && validationErrors.value.length === 0
})

/** 提交按钮是否可点击 */
const canSubmit = computed(() => {
  return isFormValid.value && !submitting.value
})

// ==================== Excel 导入 ====================

const excelInputRef = ref<HTMLInputElement>()

/** Excel 模板表头 */
const TEMPLATE_HEADERS = [
  'material', 'ean', 'brand', 'category', 'description',
  'season', 'color', 'size', 'price', 'quantity'
]

/** Excel 表头中文映射 */
const TEMPLATE_HEADERS_CN: Record<string, string> = {
  material: '物料编码',
  ean: 'EAN码',
  brand: '品牌',
  category: '品类',
  description: '描述',
  season: '季节',
  color: '颜色',
  size: '尺码',
  price: '价格',
  quantity: '数量'
}

/** 触发文件选择 */
const triggerExcelInput = () => {
  excelInputRef.value?.click()
}

/** 文件选择变更 */
const handleExcelFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && validateExcelFileType(file)) {
    await processExcelFile(file)
  }
  // 重置 input 以支持重复选择同一文件
  if (target) target.value = ''
}

/** 校验文件类型 */
const validateExcelFileType = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  // 对于 .xlsx/.xls 文件，部分浏览器/系统可能返回空 type
  if (file.type && !validTypes.includes(file.type)) {
    ElMessage.error('请上传 Excel 文件（.xlsx 或 .xls 格式）')
    return false
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    ElMessage.error('请上传 Excel 文件（.xlsx 或 .xls 格式）')
    return false
  }
  return true
}

/** 处理 Excel 文件 */
const processExcelFile = async (file: File) => {
  try {
    const result = await ExcelImporter.readExcel(file, {
      headers: TEMPLATE_HEADERS,
      skipHeader: true
    })

    if (!result.data || result.data.length === 0) {
      ElMessage.warning('Excel 文件中没有数据')
      return
    }

    let addCount = 0
    let skipCount = 0

    result.data.forEach((row: any) => {
      const material = row.material?.toString().trim()
      if (!material) {
        skipCount++
        return
      }

      // 已存在则跳过
      if (tableData.value.find(r => r.material === material)) {
        skipCount++
        return
      }

      const quantity = parseInt(row.quantity, 10)
      const price = parseFloat(row.price)

      tableData.value.push({
        material,
        ean: row.ean?.toString().trim() || '',
        brand: row.brand?.toString().trim() || '',
        category: row.category?.toString().trim() || '',
        description: row.description?.toString().trim() || '',
        season: row.season?.toString().trim() || '',
        color: row.color?.toString().trim() || '',
        size: row.size?.toString().trim() || '',
        price: isNaN(price) ? 0 : price,
        quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity,
      })
      addCount++
    })

    if (addCount > 0) {
      ElMessage.success(`成功导入 ${addCount} 条明细` + (skipCount > 0 ? `，跳过 ${skipCount} 条重复或无效数据` : ''))
    } else {
      ElMessage.warning(`未能导入任何数据，${skipCount > 0 ? `已跳过 ${skipCount} 条重复或无效数据` : '请检查文件内容'}`)
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Excel 解析失败，请检查文件格式')
  }
}

/** 下载导入模板 */
const downloadTemplate = () => {
  const templateData = [
    {
      material: 'M001',
      ean: '1234567890123',
      brand: 'NIKE',
      category: '运动鞋',
      description: 'Air Max 270',
      season: '2025SS',
      color: '红/白',
      size: '42',
      price: 899.0,
      quantity: 100
    },
    {
      material: 'M002',
      ean: '',
      brand: '',
      category: '',
      description: '',
      season: '',
      color: '',
      size: '',
      price: '',
      quantity: 1
    }
  ]

  // 构建中文表头行
  const cnHeaders = TEMPLATE_HEADERS.map(h => TEMPLATE_HEADERS_CN[h] || h)
  const dataRows = templateData.map(row =>
    TEMPLATE_HEADERS.map(h => (row as any)[h] ?? '')
  )

  ExcelImporter.downloadExcel(
    [cnHeaders, ...dataRows],
    '入库订单导入模板.xlsx',
    [],
    '入库订单明细'
  )

  ElMessage.success('模板下载成功')
}

// ==================== 提交 ====================

const submitting = ref(false)
const globalErrorMsg = ref('')

/** 生成订单号：IN + YYYYMMDD + 4位随机数字 */
const generateOrderNo = (): string => {
  const now = new Date()
  const y = now.getFullYear().toString()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const seq = Math.floor(Math.random() * 9000 + 1000).toString()
  return `IN${y}${m}${d}${seq}`
}

/** 提交入库订单 */
const handleSubmit = async () => {
  // 二次防御性校验
  if (tableData.value.length === 0) {
    ElMessage.warning('请至少添加一条物料明细')
    return
  }

  if (validationErrors.value.length > 0) {
    ElMessage.warning('请修正校验错误后再提交')
    return
  }

  if (submitting.value) {
    return
  }

  // 构建 items 数组（严格按 API 文档定义）
  const items: InboundOrderItemRequest[] = tableData.value.map(row => ({
    ean: row.ean || '',
    material: row.material,
    quantity: row.quantity,
  }))

  // 获取当前操作员ID
  const userInfo = getUserInfo()
  const operatorId = userInfo?.id

  // 组装请求体（严格按 POST /inbound/create API 定义）
  const requestBody: CreateInboundOrderRequest = {
    orderNo: generateOrderNo(),
    orderType: orderForm.value.orderType || '采购入库',
    supplier: orderForm.value.supplier || undefined,
    operatorId: operatorId || undefined,
    status: '待入库',
    remark: orderForm.value.remark || undefined,
    items
  }

  globalErrorMsg.value = ''
  submitting.value = true

  try {
    const response: any = await createInboundOrder(requestBody)

    // 成功 — code: 200（request 拦截器已解包 AxiosResponse，返回 Result<T> 结构）
    if (response.code === 200) {
      ElMessage.success({
        message: `入库订单创建成功！订单号：${requestBody.orderNo}`,
        duration: 3000
      })

      // 跳转到入库订单列表页
      setTimeout(() => {
        router.push('/inbound-management/inbound')
      }, 1200)
    } else {
      // 非 200 的业务错误
      globalErrorMsg.value = response.message || '入库订单创建失败'
    }
  } catch (error: any) {
    // 网络异常或拦截器已处理的错误
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      '网络异常，请检查网络连接后重试'
    globalErrorMsg.value = errMsg
    console.error('创建入库订单失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-inbound-container {
  padding: 20px;
}

.inbound-card {
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

/* ===== 订单表单 ===== */
.order-form {
  margin-top: 8px;
}

/* ===== 物料搜索 ===== */
.material-search-area {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  width: 100%;
}

.search-desc {
  font-weight: 500;
  color: var(--wms-text);
  flex-shrink: 0;
}

.search-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

/* ===== 表格 ===== */
.table-section {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-header .section-title {
  margin: 0;
}

/* 空状态 */
.empty-state {
  padding: 48px 0;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 12px 0 4px;
}

.empty-hint {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}

/* ===== 校验错误 ===== */
.validation-alert {
  margin: 16px 0 0;
}

.error-list {
  margin: 8px 0 0;
  padding-left: 20px;
}

.error-list li {
  font-size: 13px;
  color: var(--el-color-warning);
  line-height: 1.8;
}

/* ===== 提交区 ===== */
.submit-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
  gap: 12px;
}

.submit-info {
  display: flex;
  align-items: center;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.info-text.warning {
  color: var(--el-color-warning);
}

.info-text.success {
  color: var(--el-color-success);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .create-inbound-container {
    padding: 12px;
  }

  .card-title {
    font-size: 18px;
  }

  .material-search-area {
    flex-direction: column;
  }

  .material-search-area .el-button {
    width: 100%;
  }

  .submit-section {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-section .el-button {
    width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .create-inbound-container {
    padding: 16px;
  }
}
</style>
