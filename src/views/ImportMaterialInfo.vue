<template>
  <div class="import-container">
    <el-card class="import-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">导入物料信息</h2>
          <el-button
            type="primary"
            :icon="Download"
            @click="downloadTemplate"
          >
            下载模板
          </el-button>
        </div>
      </template>

      <!-- 文件上传区域 -->
      <div
        class="upload-area"
        :class="{ 'is-dragover': isDragOver }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          class="file-input"
          @change="handleFileSelect"
        />

        <div class="upload-content">
          <el-icon class="upload-icon" :size="64">
            <Upload />
          </el-icon>
          <p class="upload-text">点击或拖拽Excel文件到此处上传</p>
          <p class="upload-hint">支持 .xlsx 和 .xls 格式</p>
        </div>
      </div>

      <!-- 文件信息 -->
      <div v-if="selectedFile" class="file-info">
        <el-alert
          :title="selectedFile.name"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="file-details">
              <span>文件大小: {{ formatFileSize(selectedFile.size) }}</span>
              <el-button
                type="danger"
                size="small"
                text
                @click="clearFile"
              >
                移除文件
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 数据预览区域 -->
      <div v-if="previewData.length > 0" class="preview-section">
        <div class="preview-header">
          <h3 class="preview-title">
            <el-icon><View /></el-icon>
            数据预览
          </h3>
          <el-tag type="success" size="large">
            共 {{ previewData.length }} 条数据
          </el-tag>
        </div>

        <el-table
          :data="previewData"
          stripe
          style="width: 100%"
          max-height="500"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column type="index" label="序号" width="80" align="center" />

          <el-table-column prop="materialCode" label="物料编码" min-width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'error' ? 'danger' : 'info'">
                {{ row.materialCode }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="eanCode" label="EAN码" min-width="140" />

          <el-table-column prop="brand" label="品牌" min-width="120" />

          <el-table-column prop="category" label="分类" min-width="120" />

          <el-table-column prop="color" label="颜色" width="100" />

          <el-table-column prop="size" label="尺寸" width="100" />

          <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />

          <el-table-column prop="price" label="价格" width="100" align="right">
            <template #default="{ row }">
              <span class="price-text">¥{{ row.price }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'success'" type="success" size="small">
                正确
              </el-tag>
              <el-tag v-else type="danger" size="small">
                错误
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="错误信息" min-width="200">
            <template #default="{ row }">
              <span v-if="row.errorMsg" class="error-text">
                {{ row.errorMsg }}
              </span>
              <span v-else class="success-text">✓</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作按钮区域 -->
      <div v-if="previewData.length > 0" class="action-section">
        <el-button
          type="warning"
          size="large"
          :icon="Refresh"
          @click="resetImport"
        >
          重新导入
        </el-button>

        <el-button
          type="success"
          size="large"
          :icon="Check"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="hasErrors"
        >
          {{ isSubmitting ? '提交中...' : '确认导入' }}
        </el-button>
      </div>

      <!-- 统计信息 -->
      <div v-if="previewData.length > 0" class="statistics-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-statistic title="总数据量" :value="previewData.length">
              <template #suffix>条</template>
            </el-statistic>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-statistic title="正确数据" :value="successCount" value-style="color: #67c23a">
              <template #suffix>条</template>
            </el-statistic>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-statistic title="错误数据" :value="errorCount" value-style="color: #f56c6c">
              <template #suffix>条</template>
            </el-statistic>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Download,
  View,
  Refresh,
  Check
} from '@element-plus/icons-vue'
import ExcelImporter from '@/utils/ExcelImporter'

interface MaterialData {
  materialCode: string
  eanCode?: string
  brand: string
  category?: string
  color?: string
  size?: string
  description?: string
  price: number
  rowNum?: number
  status?: 'success' | 'error'
  errorMsg?: string
}

const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewData = ref<MaterialData[]>([])
const isSubmitting = ref(false)
const isDragOver = ref(false)

// 预期表头
const HEADERS = [
  'materialCode',
  'eanCode',
  'brand',
  'category',
  'color',
  'size',
  'description',
  'price'
]

// 校验规则
const VALIDATION_RULES = [
  { field: 'materialCode', required: true, message: '物料编码不能为空' },
  { field: 'brand', required: true, message: '品牌不能为空' },
  {
    field: 'price',
    required: true,
    validator: (value: any) => !isNaN(Number(value)),
    message: '价格必须是数字'
  },
  {
    field: 'eanCode',
    validator: (value: any) => !value || value.toString().length === 13,
    message: 'EAN码必须是13位'
  }
]

// 计算属性
const successCount = computed(() => {
  return previewData.value.filter(item => item.status === 'success').length
})

const errorCount = computed(() => {
  return previewData.value.filter(item => item.status === 'error').length
})

const hasErrors = computed(() => {
  return errorCount.value > 0
})

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

// 处理拖拽悬停
const handleDragOver = () => {
  isDragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = () => {
  isDragOver.value = false
}

// 处理拖拽放下
const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (validateFileType(file)) {
      await processFile(file)
    }
  }
}

// 验证文件类型
const validateFileType = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]

  if (!validTypes.includes(file.type)) {
    ElMessage.error('请上传Excel文件（.xlsx 或 .xls）')
    return false
  }

  return true
}

// 处理文件
const processFile = async (file: File) => {
  try {
    selectedFile.value = file

    // 读取Excel文件
    const result = await ExcelImporter.readExcel(file, {
      headers: HEADERS,
      skipHeader: true
    })

    // 数据校验
    const validatedData = ExcelImporter.validateData(result.data, VALIDATION_RULES)

    previewData.value = validatedData as MaterialData[]

    ElMessage.success(`成功解析 ${result.rowCount} 条数据`)
  } catch (error) {
    ElMessage.error((error as Error).message)
    clearFile()
  }
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  previewData.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 重新导入
const resetImport = () => {
  clearFile()
  ElMessage.info('请重新选择文件')
}

// 提交导入
const handleSubmit = async () => {
  if (previewData.value.length === 0) {
    ElMessage.warning('请先上传文件')
    return
  }

  if (hasErrors.value) {
    ElMessage.warning('存在错误数据，请修正后重试')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要导入 ${previewData.value.length} 条物料数据吗？`,
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isSubmitting.value = true

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 准备提交数据
    const submitData = {
      materials: previewData.value.map(({ rowNum, status, errorMsg, ...data }) => data),
      total: previewData.value.length,
      importTime: new Date().toISOString()
    }

    console.log('提交的导入数据:', submitData)

    // 显示成功消息
    ElMessage.success({
      message: `导入成功！共导入 ${submitData.total} 条物料数据`,
      duration: 3000
    })

    // 清空数据
    resetImport()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导入失败，请稍后重试')
      console.error('导入错误:', error)
    }
  } finally {
    isSubmitting.value = false
  }
}

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {
      materialCode: 'MAT001',
      eanCode: '6901028089888',
      brand: '示例品牌',
      category: '电子产品',
      color: '红色',
      size: 'L',
      description: '这是一个示例物料',
      price: 99.99
    },
    {
      materialCode: 'MAT002',
      eanCode: '6901028089889',
      brand: '测试品牌',
      category: '办公用品',
      color: '蓝色',
      size: 'M',
      description: '测试物料描述',
      price: 49.99
    }
  ]

  ExcelImporter.downloadExcel(
    templateData,
    '物料导入模板.xlsx',
    HEADERS,
    '物料信息'
  )

  ElMessage.success('模板下载成功')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.import-container {
  padding: 20px;
}

.import-card {
  border-radius: 12px;
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
  color: #1d1b20;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #6750a4;
  background-color: #f5f0ff;
}

.file-input {
  display: none;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  color: #6750a4;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin: 12px 0;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
  margin: 8px 0 0;
}

/* 文件信息 */
.file-info {
  margin-top: 20px;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

/* 预览区域 */
.preview-section {
  margin-top: 30px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e6e0e9;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1d1b20;
  margin: 0;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
}

.error-text {
  color: #f56c6c;
  font-size: 13px;
}

.success-text {
  color: #67c23a;
  font-weight: bold;
}

/* 操作按钮区域 */
.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e6e0e9;
}

/* 统计区域 */
.statistics-section {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-container {
    padding: 12px;
  }

  .upload-area {
    padding: 40px 16px;
  }

  .action-section {
    flex-direction: column;
  }

  .action-section .el-button {
    width: 100%;
  }

  .statistics-section {
    padding: 16px;
  }
}
</style>
