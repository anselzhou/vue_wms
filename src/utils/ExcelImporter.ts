// src/utils/ExcelImporter.ts
import * as XLSX from 'xlsx'

/**
 * Excel工作表数据接口
 */
interface SheetData {
  data: any[]
  sheetName: string
  rowCount: number
  columnCount: number
}

/**
 * 验证结果接口
 */
interface ValidationResult {
  valid: boolean
  message: string
  columnCount?: number
  rowCount?: number
}

/**
 * 校验规则接口
 */
interface ValidationRule {
  field: string
  required?: boolean
  validator?: (value: any, row?: any) => boolean
  message?: string
}

/**
 * Excel文件解析工具类
 */
class ExcelImporter {
  /**
   * 读取Excel文件并转换为JSON数据
   * @param file - Excel文件对象
   * @param options - 配置选项
   * @returns 解析结果
   */
  static async readExcel(
    file: File,
    options: { headers?: string[]; skipHeader?: boolean } = {}
  ): Promise<SheetData> {
    const defaultOptions = {
      headers: [],
      skipHeader: true
    }

    const opts = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
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
            columnCount: opts.headers.length || validationResult.columnCount || 0
          })
        } catch (error) {
          reject(new Error(`Excel解析失败: ${(error as Error).message}`))
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
   * @param worksheet - Excel工作表对象
   * @param expectedHeaders - 预期表头数组
   * @returns 验证结果
   */
  static validateWorksheet(
    worksheet: any,
    expectedHeaders: string[] = []
  ): ValidationResult {
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
      const headerMatch = headers.every(
        (header: any, index: number) =>
          header?.toString().toLowerCase().trim() ===
          expectedHeaders[index].toLowerCase().trim()
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
   * @param data - 数据数组
   * @param fileName - 文件名
   * @param headers - 表头数组
   * @param sheetName - 工作表名称
   */
  static downloadExcel(
    data: any[],
    fileName: string = 'export.xlsx',
    headers: string[] = [],
    sheetName: string = 'Sheet1'
  ): void {
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
   * @param data - 数据数组
   * @param rules - 校验规则数组
   * @returns 校验后的数据
   */
  static validateData(data: any[], rules: ValidationRule[] = []): any[] {
    return data.map((item, index) => {
      const rowNum = index + 2 // 行号从2开始（表头为1）
      const errors: string[] = []

      rules.forEach((rule) => {
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

export default ExcelImporter
