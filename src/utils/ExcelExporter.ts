import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
* Excel 导出工具类
* 支持自定义表头、数据转换、格式优化
*/
class ExcelExporter {
/**
* 构造函数
* @param {Object} options - 全局配置
*/
constructor(options = {}) {
this.defaultOptions = {
fileName: '导出数据.xlsx',
sheetName: 'Sheet1',
autoWidth: true,
headerCellStyle: {
fill: { fgColor: { rgb: 'FFCCCCCC' } },
font: { bold: true }
}
}

this.options = { ...this.defaultOptions, ...options }
}

/**
* 将数据导出为 Excel 文件
* @param {Array} data - 数据源（对象数组）
* @param {Object} fields - 字段映射 { 字段名: 表头名称 }
* @param {Object} options - 导出配置（可选）
* @returns {Promise} 导出结果
*/
exportToExcel(data, fields, options = {}) {
return new Promise((resolve, reject) => {
try {
const opts = { ...this.options, ...options }

// 1. 准备数据和表头
const { headers, exportData } = this.prepareData(data, fields)

// 2. 创建工作簿和工作表
const worksheet = XLSX.utils.json_to_sheet(exportData)

// 3. 自动调整列宽
if (opts.autoWidth) {
this.setAutoWidth(worksheet, headers, exportData)
}

// 4. 设置表头样式
if (opts.headerCellStyle) {
this.setHeaderStyle(worksheet, headers, opts.headerCellStyle)
}

// 5. 创建工作簿并添加工作表
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, opts.sheetName)

// 6. 生成 Excel 文件并下载
const excelBuffer = XLSX.write(workbook, {
bookType: 'xlsx',
type: 'array',
cellStyles: true, // 启用样式支持
cellDates: true // 处理日期格式
})

const blob = new Blob([excelBuffer], {
type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
})

// 使用 file-saver 触发下载，让用户选择保存路径
saveAs(blob, opts.fileName)

resolve({
success: true,
message: '导出成功',
exportedCount: data.length
})
} catch (error) {
reject({
success: false,
message: `导出失败: ${error.message}`
})
}
})
}

/**
* 准备导出数据和表头
* @param {Array} data - 原始数据
* @param {Object} fields - 字段映射
* @returns {Object} 处理后的表头和数据
*/
prepareData(data, fields) {
// 创建表头数组
const headers = Object.values(fields)

// 转换数据结构
const exportData = data.map(item => {
const row = {}

Object.keys(fields).forEach(field => {
// 支持自定义转换函数
if (typeof fields[field] === 'object') {
const { label, formatter } = fields[field]
row[label] = formatter ? formatter(item[field], item) : item[field]
} else {
row[fields[field]] = item[field]
}
})

return row
})

return { headers, exportData }
}

/**
* 设置自动列宽
* @param {Object} worksheet - 工作表
* @param {Array} headers - 表头数组
* @param {Array} data - 数据源
*/
setAutoWidth(worksheet, headers, data) {
// 计算每列最大宽度
const colWidths = headers.map((header, index) => {
let maxWidth = header.length * 10 // 表头宽度

// 计算数据列最大宽度
data.forEach(row => {
const cellValue = row[header]
if (cellValue != null) {
const cellWidth = String(cellValue).length * 10
if (cellWidth > maxWidth) {
maxWidth = cellWidth
}
}
})

return { wch: Math.max(maxWidth / 10, 10) } // 最小宽度10
})

worksheet['!cols'] = colWidths
}

/**
* 设置表头样式
* @param {Object} worksheet - 工作表
* @param {Array} headers - 表头数组
* @param {Object} style - 样式配置
*/
setHeaderStyle(worksheet, headers) {
// 获取表头单元格范围
const range = XLSX.utils.decode_range(worksheet['!ref'])

// 为表头行设置样式
for (let c = range.s.c; c <= range.e.c; c++) { const cellAddress={ r: range.s.r, c } const
  cellRef=XLSX.utils.encode_cell(cellAddress) if (worksheet[cellRef]) {
  worksheet[cellRef].s=this.options.headerCellStyle } } } /** * 创建模板文件 * @param {Object} fields - 字段映射 * @param {Object}
  options - 配置 */ createTemplate(fields, options={}) { const opts={ ...this.options, ...options } const
  templateData=this.createTemplateData(fields) this.exportToExcel(templateData, fields, { ...opts, fileName:
  opts.fileName || '导入模板.xlsx' }) } /** * 创建模板数据 * @param {Object} fields - 字段映射 * @returns {Array} 模板数据 */
  createTemplateData(fields) { const templateRow={} Object.keys(fields).forEach(field=> {
  const header = typeof fields[field] === 'object' ? fields[field].label : fields[field]
  templateRow[field] = `请输入${header}`
  })

  return [templateRow]
  }
  }

  // 创建默认实例
  const excelExporter = new ExcelExporter()

  // 导出工具类和默认实例
  export { ExcelExporter, excelExporter }

  // 导出快捷方法
  export const exportToExcel = (data, fields, options) => {
  return excelExporter.exportToExcel(data, fields, options)
  }

  export const createExcelTemplate = (fields, options) => {
  return excelExporter.createTemplate(fields, options)
  }
  /**
  // 基础用法
  <template>
    <div class="export-page">
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
      <el-button @click="handleCreateTemplate">下载模板</el-button>
    </div>
  </template>

  <script setup>
  import { exportToExcel, createExcelTemplate } from '@/utils/excel-export'

  // 页面数据
  const tableData = [
    {
      id: 1,
      materialCode: 'MAT001',
      eanCode: '6901028089888',
      brand: '示例品牌',
      category: '电子产品',
      price: 99.99,
      createTime: new Date('2024-01-01')
    },
    // 更多数据...
  ]

  // 字段映射配置
  const exportFields = {
    id: '序号',
    materialCode: '物料编码',
    eanCode: 'EAN码',
    brand: '品牌',
    category: '分类',
    price: '价格',
    createTime: {
      label: '创建时间',
      formatter: (value) => new Date(value).toLocaleString()
    }
  }

  // 导出按钮点击事件
  const handleExport = async () => {
    try {
      const result = await exportToExcel(tableData, exportFields, {
        fileName: '物料信息.xlsx',
        sheetName: '物料清单'
      })

      alert(result.message)
      console.log('导出成功:', result)
    } catch (error) {
      alert(error.message)
      console.error('导出失败:', error)
    }
  }

  // 下载模板
  const handleCreateTemplate = () => {
    createExcelTemplate(exportFields, {
      fileName: '物料导入模板.xlsx'
    })
  }
</script>

  //高级用法，带数据转换和验证。
  // 复杂字段映射，包含数据转换
  const complexFields = {
  id: '序号',
  materialCode: '物料编码',
  status: {
  label: '状态',
  formatter: (value) => {
  const statusMap = { 0: '禁用', 1: '启用', 2: '待审核' }
  return statusMap[value] || '未知'
  }
  },
  price: {
  label: '价格',
  formatter: (value) => `¥${value.toFixed(2)}`
  },
  createTime: {
  label: '创建时间',
  formatter: (value) => new Date(value).toISOString().split('T')[0]
  }
  }

  // 导出前数据验证
  const validateBeforeExport = (data) => {
  const errors = []

  data.forEach((item, index) => {
  if (!item.materialCode) {
  errors.push(`第${index + 1}行物料编码不能为空`)
  }

  if (item.price <= 0) { errors.push(`第${index + 1}行价格必须大于0`) } }) if (errors.length> 0) {
    throw new Error('数据验证失败:\n' + errors.join('\n'))
    }
    }

    // 导出操作
    const handleComplexExport = async () => {
    try {
    // 导出前验证
    validateBeforeExport(tableData)

    // 导出数据
    await exportToExcel(tableData, complexFields, {
    fileName: '物料信息_带格式.xlsx',
    autoWidth: true,
    headerCellStyle: {
    fill: { fgColor: { rgb: 'FF409EFF' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' } }
    }
    })

    alert('导出成功')
    } catch (error) {
    alert(error.message)
    }
    }
    */
