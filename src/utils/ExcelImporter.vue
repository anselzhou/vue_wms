 import * as XLSX from 'xlsx'
 
 /**
  * Excel文件解析工具类
  */
 class ExcelUtils {
   /**
    * 读取Excel文件并转换为JSON数据
    * @param {File} file - Excel文件对象
    * @param {Object} options - 配置选项
    * @param {Array} options.headers - 预期表头数组
    * @param {Boolean} options.skipHeader - 是否跳过表头行
    * @returns {Promise<Object>} 解析结果
    */
   static async readExcel(file, options = {}) {
     const defaultOptions = {
       headers: [],
       skipHeader: true
     }
     
     const opts = { ...defaultOptions, ...options }
     
     return new Promise((resolve, reject) => {
       const reader = new FileReader()
       
       reader.onload = (e) => {
         try {
           const data = new Uint8Array(e.target.result)
           const workbook = XLSX.read(data, { type: 'array' })
           const firstSheetName = workbook.SheetNames[0]
           const worksheet = workbook.Sheets[firstSheetName]
           
           // 基础校验
           const validationResult = this.validateWorksheet(worksheet, opts.headers)
           if (!validationResult.valid) {
             reject(new Error(validationResult.message))
             return
           }
           
           // 转换为JSON
           const jsonData = XLSX.utils.sheet_to_json(worksheet, {
             header: opts.headers.length > 0 ? opts.headers : undefined,
             skipHeader: opts.skipHeader
           })
           
           resolve({
             data: jsonData,
             sheetName: firstSheetName,
             rowCount: jsonData.length,
             columnCount: opts.headers.length || validationResult.columnCount
           })
         } catch (error) {
           reject(new Error(`Excel解析失败: ${error.message}`))
         }
       }
       
       reader.onerror = () => {
         reject(new Error('文件读取失败'))
       }
       
       reader.readAsArrayBuffer(file)
     })
   }
 
   /**
    * 验证Excel工作表结构
    * @param {Object} worksheet - Excel工作表对象
    * @param {Array} expectedHeaders - 预期表头数组
    * @returns {Object} 验证结果
    */
   static validateWorksheet(worksheet, expectedHeaders = []) {
     const range = XLSX.utils.decode_range(worksheet['!ref'])
     const columnCount = range.e.c + 1
     const rowCount = range.e.r + 1
     
     // 检查列数
     if (expectedHeaders.length > 0 && columnCount !== expectedHeaders.length) {
       return {
         valid: false,
         message: `表格必须包含${expectedHeaders.length}列，当前有${columnCount}列`,
         columnCount,
         rowCount
       }
     }
     
     // 检查表头
     if (expectedHeaders.length > 0) {
       const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0]
       const headerMatch = headers.every((header, index) => 
         header?.toLowerCase().trim() === expectedHeaders[index].toLowerCase().trim()
       )
       
       if (!headerMatch) {
         return {
           valid: false,
           message: '表头格式不符合要求',
           columnCount,
           rowCount
         }
       }
     }
     
     return {
       valid: true,
       message: '验证通过',
       columnCount,
       rowCount
     }
   }
 
   /**
    * 创建Excel文件并下载
    * @param {Array} data - 数据数组
    * @param {String} fileName - 文件名
    * @param {Array} headers - 表头数组
    * @param {String} sheetName - 工作表名称
    */
   static downloadExcel(data, fileName = 'export.xlsx', headers = [], sheetName = 'Sheet1') {
     let worksheet
     
     if (headers.length > 0) {
       // 添加表头
       const headerRow = headers
       const dataWithHeader = [headerRow, ...data]
       worksheet = XLSX.utils.aoa_to_sheet(dataWithHeader)
     } else {
       // 直接转换JSON数据
       worksheet = XLSX.utils.json_to_sheet(data)
     }
     
     const workbook = XLSX.utils.book_new()
     XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
     
     // 下载文件
     XLSX.writeFile(workbook, fileName)
   }
 
   /**
    * 数据校验工具
    * @param {Array} data - 数据数组
    * @param {Array} rules - 校验规则数组
    * @returns {Array} 校验后的数据
    */
   static validateData(data, rules = []) {
     return data.map((item, index) => {
       const rowNum = index + 2 // 行号从2开始（表头为1）
       const errors = []
       
       rules.forEach(rule => {
         const { field, required, validator, message } = rule
         
         // 必填校验
         if (required && !item[field]) {
           errors.push(message || `${field}不能为空`)
           return
         }
         
         // 自定义校验器
         if (validator && typeof validator === 'function') {
           const isValid = validator(item[field], item)
           if (!isValid) {
             errors.push(message || `${field}格式不正确`)
           }
         }
       })
       
       return {
         ...item,
         rowNum,
         status: errors.length === 0 ? 'success' : 'error',
         errorMsg: errors.join('; ')
       }
     })
   }
 }
 
 export default ExcelUtils
/*
 <template>
   <div>
     <input type="file" @change="handleFileChange" accept=".xlsx,.xls">
     <button @click="downloadTemplate">下载模板</button>
   </div>
 </template>
 
 <script setup>
 import ExcelUtils from '@/utils/excel-utils'
 
 // 预期表头
 const HEADERS = [
   'materialCode', 'eanCode', 'brand', 'category', 
   'color', 'size', 'description', 'price'
 ]
 
 // 校验规则
 const VALIDATION_RULES = [
   { field: 'materialCode', required: true, message: '物料编码不能为空' },
   { field: 'brand', required: true, message: '品牌不能为空' },
   { field: 'price', required: true, validator: (value) => !isNaN(Number(value)), message: '价格必须是数字' },
   { field: 'eanCode', validator: (value) => !value || value.length === 13, message: 'EAN码必须是13位' }
 ]
 
 // 文件上传处理
 const handleFileChange = async (event) => {
   const file = event.target.files[0]
   if (!file) return
   
   try {
     // 读取Excel文件
     const result = await ExcelUtils.readExcel(file, { headers: HEADERS })
     
     // 数据校验
     const validatedData = ExcelUtils.validateData(result.data, VALIDATION_RULES)
     
     // 处理校验后的数据
     console.log('校验后的数据:', validatedData)
     
   } catch (error) {
     console.error('处理失败:', error.message)
   }
 }
 
 // 下载模板
 const downloadTemplate = () => {
   const templateData = [
     { materialCode: 'MAT001', eanCode: '6901028089888', brand: '示例品牌', category: '电子产品', price: 99.99 }
   ]
   
   ExcelUtils.downloadExcel(templateData, '物料导入模板.xlsx', HEADERS, '物料信息')
 }
 </script>
**/
