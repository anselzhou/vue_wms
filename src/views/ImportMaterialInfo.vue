<template>
  <div class="min-h-screen bg-zinc-950 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- 标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
          <FileSpreadsheet class="w-9 h-9 text-emerald-500" />
          物料信息导入
        </h1>
        <p class="text-zinc-400 mt-1">支持 .xlsx / .xls 文件 • 自动识别表头</p>
      </div>

      <!-- 顶部操作栏 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
        <div class="flex items-center gap-4">
          <!-- 文本输入框（支持拖拽 + 显示路径） -->
          <div class="flex-1 relative group" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop">
            <div class="flex items-center bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 transition-all"
              :class="{ 'border-emerald-500 bg-emerald-950/30': isDragging }">
              <input v-model="filePath" type="text" placeholder="Excel文件路径 或 拖拽文件到此处" readonly
                class="flex-1 bg-transparent outline-none text-white placeholder-zinc-500 text-lg" />
              <FileSpreadsheet v-if="selectedFile" class="w-5 h-5 text-emerald-500 ml-3" />
            </div>
          </div>

          <!-- 打开按钮（带 Excel 图标） -->
          <button @click="triggerFileSelect"
            class="flex items-center gap-3 bg-white text-zinc-900 hover:bg-emerald-500 hover:text-white px-8 py-4 rounded-2xl font-medium text-lg transition-all active:scale-95">
            <FolderOpen class="w-6 h-6" />
            打开文件
          </button>

          <!-- 上传按钮 -->
          <button @click="showConfirmModal = true" :disabled="!excelData.length"
            class="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 px-8 py-4 rounded-2xl font-medium text-lg text-white transition-all active:scale-95">
            <Upload class="w-6 h-6" />
            上传到系统
          </button>
        </div>

        <!-- 文件信息提示 -->
        <div v-if="selectedFile" class="mt-4 text-sm text-zinc-400 flex items-center gap-2">
          <span class="px-3 py-1 bg-zinc-800 rounded-xl">已选择：{{ selectedFile.name }}</span>
          <span class="text-emerald-400">共 {{ excelData.length }} 条数据（不含表头）</span>
        </div>
      </div>

      <!-- 文件选择隐藏 input -->
      <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />

      <!-- 数据预览表格 -->
      <div v-if="excelData.length" class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div class="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div class="font-medium text-white">预览表格（前 8 行）</div>
          <div class="text-xs text-zinc-400">共 {{ excelData.length }} 行数据 • 第一行为表头</div>
        </div>

        <div class="overflow-x-auto max-h-[560px]">
          <table class="w-full text-sm">
            <!-- 表头 -->
            <thead class="bg-zinc-950 sticky top-0 z-10">
              <tr>
                <th v-for="(header, i) in headers" :key="i"
                  class="px-6 py-4 text-left font-medium text-zinc-400 border-b border-zinc-800 whitespace-nowrap">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <!-- 数据行 -->
            <tbody class="divide-y divide-zinc-800">
              <tr v-for="(row, rowIndex) in displayRows" :key="rowIndex" class="hover:bg-zinc-800/50">
                <td v-for="(cell, colIndex) in row" :key="colIndex" class="px-6 py-4 text-white whitespace-nowrap">
                  {{ cell ?? '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-else
        class="bg-zinc-900 border border-zinc-800 rounded-3xl h-96 flex flex-col items-center justify-center text-zinc-400">
        <FileSpreadsheet class="w-16 h-16 mb-6 opacity-30" />
        <p class="text-xl">尚未选择 Excel 文件</p>
        <p class="text-sm mt-2">点击「打开文件」或拖拽文件到上方输入框</p>
      </div>
    </div>

    <!-- 确认上传弹窗 -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-zinc-900 rounded-3xl w-full max-w-md mx-4 overflow-hidden">
        <div class="p-8 text-center">
          <AlertCircle class="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 class="text-2xl font-semibold text-white mb-3">确定要上传吗？</h2>
          <p class="text-zinc-400">即将把表格中 <span class="text-emerald-400">{{ excelData.length }}</span> 条数据（已排除表头）<br>以
            JSON 格式发送至后端接口</p>
        </div>

        <div class="flex border-t border-zinc-800">
          <button @click="showConfirmModal = false"
            class="flex-1 py-6 text-lg font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">
            取消
          </button>
          <button @click="handleUpload"
            class="flex-1 py-6 text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">
            确认上传
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, FolderOpen, Upload, AlertCircle } from 'lucide-vue-next'

// ==================== 状态 ====================
const fileInput = ref(null)
const filePath = ref('')
const selectedFile = ref(null)
const headers = ref([])
const excelData = ref([])        // 除去表头后的所有数据行（二维数组）
const showConfirmModal = ref(false)
const isDragging = ref(false)

// ==================== 文件处理 ====================
const parseExcel = (file) => {
  selectedFile.value = file
  filePath.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // 转为二维数组（第一行为表头）
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length > 0) {
      headers.value = jsonData[0]               // 第一行表头
      excelData.value = jsonData.slice(1)       // 剩余所有数据行
    }
  }
  reader.readAsArrayBuffer(file)
}

// 点击「打开文件」按钮
const triggerFileSelect = () => {
  fileInput.value.click()
}

// 文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) parseExcel(file)
}

// 拖拽处理
const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}
const handleDragLeave = () => {
  isDragging.value = false
}
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    parseExcel(file)
  }
}

// ==================== 上传逻辑 ====================
const displayRows = computed(() => excelData.value.slice(0, 8)) // 只展示前8行

const handleUpload = async () => {
  if (!excelData.value.length) return

  // 转为 JSON 格式（每行一个对象，使用表头作为 key）
  const materialList = excelData.value.map(row => {
    const item = {}
    headers.value.forEach((header, index) => {
      item[header] = row[index] ?? ''
    })
    return item
  })

  showConfirmModal.value = false

  try {
    // 这里使用 fetch（RuoYi 项目中可替换为 import request from '@/utils/request'）
    const response = await fetch('/insertMaterialInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(materialList)
    })

    if (response.ok) {
      alert('✅ 上传成功！')
      // 可清空表单
      // resetForm()
    } else {
      alert('❌ 上传失败，请检查后端接口')
    }
  } catch (err) {
    console.error(err)
    alert('网络错误，请稍后重试')
  }
}

// 重置（可选，可自行调用）
const resetForm = () => {
  filePath.value = ''
  selectedFile.value = null
  headers.value = []
  excelData.value = []
}
</script>

<style scoped>
/* 可选：让表格更美观 */
table {
  border-collapse: collapse;
}
</style>

/**
// 纳米AI
<template>
  <div class="import-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="title">批量导入物料信息</h2>
      <p class="subtitle">支持Excel文件拖拽上传或点击选择，最多导入1000条数据</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-area">
      <el-upload ref="uploadRef" :auto-upload="false" :file-list="fileList" :on-change="handleFileChange"
        :on-remove="handleFileRemove" :before-upload="beforeUpload" accept=".xlsx,.xls" drag class="upload-dragger">
        <i class="el-icon-upload upload-icon"></i>
        <div class="upload-text">
          将Excel文件拖到此处，或<em>点击选择文件</em>
        </div>
        <template #tip>
          <div class="upload-tip">
            <span>仅支持.xlsx/.xls格式文件，文件大小不超过10MB</span>
            <el-button type="text" @click="downloadTemplate" class="template-btn">
              下载导入模板
            </el-button>
          </div>
        </template>
      </el-upload>
    </div>

    <!-- 文件预览区域 -->
    <div v-if="fileList.length > 0" class="preview-section">
      <div class="preview-header">
        <h3>文件预览</h3>
        <el-button type="primary" :loading="isUploading" :disabled="!isFileValid || isUploading" @click="handleUpload"
          class="upload-btn">
          {{ isUploading ? '上传中...' : '确认上传' }}
        </el-button>
      </div>

      <!-- 表格预览 -->
      <div class="table-container">
        <el-table :data="previewData" border max-height="400" class="preview-table">
          <el-table-column prop="materialCode" label="物料编码" width="150" />
          <el-table-column prop="eanCode" label="EAN码" width="150" />
          <el-table-column prop="brand" label="品牌" width="120" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="price" label="价格" width="100" />
          <el-table-column prop="status" label="校验状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === 'success' ? '校验通过' : '校验失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="errorMsg" label="错误信息" min-width="200" />
        </el-table>

        <!-- 分页 -->
        <el-pagination v-if="totalPages > 1" :current-page="currentPage" :page-size="pageSize" :total="totalCount"
          @current-change="handlePageChange" layout="prev, pager, next, jumper, ->, total" class="pagination" />
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <i class="el-icon-error"></i>
      <span>{{ errorMessage }}</span>
      <el-button type="text" @click="errorMessage = ''">关闭</el-button>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="success-message">
      <i class="el-icon-success"></i>
      <span>{{ successMessage }}</span>
      <el-button type="text" @click="successMessage = ''">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'

// 响应式数据
const uploadRef = ref(null)
const fileList = ref([])
const isUploading = ref(false)
const isFileValid = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 预览数据
const previewData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// 预期表头
const expectedHeaders = [
  'material code', 'EAN code', 'brand', 'category', 
  'color', 'size', 'description', 'price', 
  'create_time', 'update_time', 'is_deleted', 'operator'
]

// 文件变化处理
const handleFileChange = (file) => {
  errorMessage.value = ''
  successMessage.value = ''
  
  // 读取Excel文件
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // 列数校验
      const range = XLSX.utils.decode_range(worksheet['!ref'])
      const columnCount = range.e.c + 1
      if (columnCount !== 12) {
        errorMessage.value = `Excel表格必须包含12列，当前表格有${columnCount}列`
        fileList.value = []
        return
      }
      
      // 表头校验
      const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0]
      const headerMatch = headers.every((header, index) => 
        header.toLowerCase().trim() === expectedHeaders[index].toLowerCase().trim()
      )
      
      if (!headerMatch) {
        errorMessage.value = 'Excel表头不符合要求，请下载正确的模板'
        fileList.value = []
        return
      }
      
      // 转换为JSON数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: [
          'materialCode', 'eanCode', 'brand', 'category', 
          'color', 'size', 'description', 'price', 
          'createTime', 'updateTime', 'isDeleted', 'operator'
        ],
        skipHeader: true
      })
      
      // 数据校验
      validateData(jsonData)
      isFileValid.value = true
      
    } catch (error) {
      errorMessage.value = 'Excel文件解析失败，请检查文件是否损坏'
      fileList.value = []
      console.error(error)
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

// 数据校验
const validateData = (data) => {
  const validatedData = data.map((item, index) => {
    const rowNum = index + 2 // 行号从2开始
    const errors = []
    
    // 非空校验
    if (!item.materialCode) errors.push('物料编码不能为空')
    if (!item.brand) errors.push('品牌不能为空')
    if (!item.category) errors.push('分类不能为空')
    if (!item.price) errors.push('价格不能为空')
    
    // 格式校验
    if (item.price && isNaN(Number(item.price))) {
      errors.push('价格必须是数字')
    }
    
    if (item.eanCode && item.eanCode.length !== 13) {
      errors.push('EAN码必须是13位')
    }
    
    return {
      ...item,
      rowNum,
      status: errors.length === 0 ? 'success' : 'error',
      errorMsg: errors.join('; ')
    }
  })
  
  previewData.value = validatedData
  totalCount.value = validatedData.length
  currentPage.value = 1
  
  // 检查是否有错误
  const hasErrors = validatedData.some(item => item.status === 'error')
  if (hasErrors) {
    ElMessage.warning('部分数据校验失败，请检查表格中的错误信息')
  } else {
    ElMessage.success('数据校验全部通过，可以上传')
  }
}

// 文件移除处理
const handleFileRemove = () => {
  isFileValid.value = false
  previewData.value = []
  errorMessage.value = ''
  successMessage.value = ''
}

// 上传前校验
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过10MB')
    return false
  }
  
  return true
}

// 处理上传
const handleUpload = async () => {
  // 确认上传
  await ElMessageBox.confirm(
    '确认要上传这些数据吗？上传后将无法撤销',
    '确认上传',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  isUploading.value = true
  
  try {
    // 准备FormData
    const formData = new FormData()
    formData.append('file', fileList.value[0].raw)
    
    // 发送请求到后端
    const response = await fetch('/api/materials/import', {
      method: 'POST',
      body: formData,
      headers: {
        // 如果需要认证，添加token
        // 'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    })
    
    const result = await response.json()
    
    if (result.success) {
      successMessage.value = `上传成功！成功导入${result.successCount}条数据，失败${result.failCount}条`
      fileList.value = []
      previewData.value = []
      isFileValid.value = false
    } else {
      errorMessage.value = `上传失败：${result.message}`
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
    console.error(error)
  } finally {
    isUploading.value = false
  }
}

// 分页切换
const handlePageChange = (page) => {
  currentPage.value = page
}

// 下载模板
const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    expectedHeaders,
    ['MAT001', '6901028089888', '示例品牌', '电子产品', '黑色', 'L', '示例描述', '99.99', '', '', '', 'admin']
  ]
  
  // 创建工作簿
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '物料信息')
  
  // 下载文件
  XLSX.writeFile(workbook, '物料导入模板.xlsx')
}
</script>

<style scoped>
.import-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #606266;
}

.upload-area {
  margin-bottom: 30px;
}

.upload-dragger {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
}

.upload-dragger:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-btn {
  color: #409eff;
}

.preview-section {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  background-color: #fafafa;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.upload-btn {
  width: 120px;
}

.table-container {
  background-color: white;
  border-radius: 6px;
  padding: 10px;
}

.preview-table {
  width: 100%;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-message i {
  margin-right: 8px;
}

.success-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 4px;
  color: #67c23a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.success-message i {
  margin-right: 8px;
}
</style>


*/
