// src/utils/ExcelImporter.ts
import * as XLSX from 'xlsx'

/** 单个工作表解析结果 */
export interface SheetData {
  /** 数据行（对象数组） */
  data: Array<Record<string, unknown>>
  /** 工作表名称 */
  sheetName: string
  /** 实际使用的表头（字段名） */
  headers: string[]
  /** 数据行数（不含表头） */
  rowCount: number
  /** 列数 */
  columnCount: number
}

/** 读取配置 */
export interface ReadExcelOptions {
  /** 预期表头（字段名数组），提供后将按此顺序映射列并校验 */
  headers?: string[]
  /** 是否跳过表头行，默认 true */
  skipHeader?: boolean
  /** 表头映射：表格表头 -> 目标字段名 */
  headerMapping?: Record<string, string>
  /** 工作表索引，默认 0（sheetName 优先） */
  sheetIndex?: number
  /** 工作表名称 */
  sheetName?: string
  /** 空单元格填充值 */
  defval?: unknown
  /** 是否保留单元格原始值（跳过 xlsx 自动类型转换） */
  raw?: boolean
}

/** 工作表结构校验结果 */
export interface WorksheetValidationResult {
  valid: boolean
  message: string
  columnCount: number
  rowCount: number
}

/** 数据校验规则 */
export interface ValidationRule {
  field: string
  required?: boolean
  validator?: (value: unknown, row: Record<string, unknown>) => boolean
  message?: string
}

/** 校验后的单行数据 */
export interface ValidatedRow extends Record<string, unknown> {
  /** 行号（从 2 开始，表头为第 1 行） */
  rowNum: number
  status: 'success' | 'error'
  errorMsg: string
}

/** 默认读取配置 */
const DEFAULT_READ_OPTIONS: ReadExcelOptions = {
  headers: [],
  skipHeader: true,
  headerMapping: {},
  sheetIndex: 0
}

/** Excel 工作表名非法字符 */
const SHEET_NAME_INVALID_CHARS = /[\\/?*[\]:]/g
/** 工作表名最大长度 */
const MAX_SHEET_NAME_LENGTH = 31

/** 清洗工作表名称，移除 Excel 不允许的字符并限制长度 */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(SHEET_NAME_INVALID_CHARS, ' ').trim()
  return (cleaned || 'Sheet1').slice(0, MAX_SHEET_NAME_LENGTH)
}

/** 确保文件名以 .xlsx 结尾 */
function ensureXlsxExtension(fileName: string): string {
  return /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`
}

/** 将任意错误规范化为可读消息 */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 判断值是否为空（null / undefined / 空字符串 / 纯空白） */
function isEmptyValue(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

/** 判断数据是否已经是二维数组（aoa） */
function isAoa(data: unknown[]): boolean {
  return data.length > 0 && Array.isArray(data[0])
}

/**
 * Excel 导入工具类
 * 支持读取解析、表头校验、字段映射、数据校验与模板下载
 */
class ExcelImporter {
  /**
   * 读取 Excel 文件并转换为 JSON 数据
   * @param file - Excel 文件对象
   * @param options - 读取配置
   * @returns 解析结果
   */
  static readExcel(
    file: File,
    options: ReadExcelOptions = {}
  ): Promise<SheetData> {
    const opts: ReadExcelOptions = { ...DEFAULT_READ_OPTIONS, ...options }

    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        reject(new Error('无效的文件对象'))
        return
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const buffer = event.target?.result
          if (!(buffer instanceof ArrayBuffer)) {
            throw new Error('文件内容读取失败')
          }

          const workbook = XLSX.read(new Uint8Array(buffer), {
            type: 'array',
            cellDates: true
          })

          if (workbook.SheetNames.length === 0) {
            throw new Error('Excel 文件不包含任何工作表')
          }

          const expectedHeaders = opts.headers ?? []
          const sheet = this.resolveSheet(workbook, opts)
          const validation = this.validateWorksheet(sheet.worksheet, expectedHeaders)

          if (!validation.valid) {
            throw new Error(validation.message)
          }

          const { data, headers } = this.sheetToJson(
            sheet.worksheet,
            opts,
            expectedHeaders
          )

          resolve({
            data,
            sheetName: sheet.name,
            headers,
            rowCount: data.length,
            columnCount: headers.length || validation.columnCount
          })
        } catch (error) {
          reject(new Error(`Excel 解析失败: ${toErrorMessage(error)}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 验证 Excel 工作表结构（列数与表头）
   * @param worksheet - Excel 工作表对象
   * @param expectedHeaders - 预期表头数组
   * @returns 验证结果
   */
  static validateWorksheet(
    worksheet: XLSX.WorkSheet,
    expectedHeaders: string[] = []
  ): WorksheetValidationResult {
    const range = worksheet['!ref']
      ? XLSX.utils.decode_range(worksheet['!ref'])
      : null
    const columnCount = range ? range.e.c + 1 : 0
    const rowCount = range ? range.e.r + 1 : 0

    if (columnCount === 0) {
      return { valid: false, message: '工作表为空', columnCount, rowCount }
    }

    // 检查列数
    if (expectedHeaders.length > 0 && columnCount !== expectedHeaders.length) {
      return {
        valid: false,
        message: `表格必须包含 ${expectedHeaders.length} 列，当前有 ${columnCount} 列`,
        columnCount,
        rowCount
      }
    }

    // 检查表头（大小写不敏感、忽略首尾空白）
    if (expectedHeaders.length > 0) {
      const firstRow = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1
      })[0] ?? []

      const headerMatch = expectedHeaders.every(
        (header, index) =>
          String(firstRow[index] ?? '').trim().toLowerCase() ===
          header.trim().toLowerCase()
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
   * 创建 Excel 文件并下载
   * @param data - 数据源（对象数组或二维数组）
   * @param fileName - 文件名
   * @param headers - 表头数组（对象数组时可指定列顺序）
   * @param sheetName - 工作表名称
   */
  static downloadExcel(
    data: unknown[],
    fileName = 'export.xlsx',
    headers: string[] = [],
    sheetName = 'Sheet1'
  ): void {
    if (!Array.isArray(data)) {
      throw new Error('导出数据必须是数组')
    }

    const aoa = ExcelImporter.toAoa(data, headers)
    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sanitizeSheetName(sheetName)
    )

    XLSX.writeFile(workbook, ensureXlsxExtension(fileName), {
      bookType: 'xlsx',
      cellDates: true
    })
  }

  /**
   * 数据校验工具
   * @param data - 数据数组
   * @param rules - 校验规则数组
   * @returns 附加了行号、状态与错误信息的行数组
   */
  static validateData(
    data: Array<Record<string, unknown>>,
    rules: ValidationRule[] = []
  ): ValidatedRow[] {
    return data.map((item, index) => {
      const rowNum = index + 2 // 行号从 2 开始（表头为 1）
      const errors: string[] = []

      for (const rule of rules) {
        const value = item[rule.field]

        // 必填校验
        if (rule.required && isEmptyValue(value)) {
          errors.push(rule.message || `${rule.field} 不能为空`)
          continue
        }

        // 自定义校验器
        if (typeof rule.validator === 'function' && !rule.validator(value, item)) {
          errors.push(rule.message || `${rule.field} 格式不正确`)
        }
      }

      return {
        ...item,
        rowNum,
        status: (errors.length === 0 ? 'success' : 'error') as 'success' | 'error',
        errorMsg: errors.join('; ')
      } as ValidatedRow
    })
  }

  /** 定位目标工作表（sheetName 优先，其次 sheetIndex） */
  private static resolveSheet(
    workbook: XLSX.WorkBook,
    options: ReadExcelOptions
  ): { name: string; worksheet: XLSX.WorkSheet } {
    let name: string

    if (options.sheetName) {
      name = options.sheetName
      if (!workbook.SheetNames.includes(name)) {
        throw new Error(`找不到名为 "${name}" 的工作表`)
      }
    } else {
      const index = options.sheetIndex ?? 0
      name = workbook.SheetNames[index]
      if (!name) {
        throw new Error(`工作表索引 ${index} 超出范围`)
      }
    }

    return { name, worksheet: workbook.Sheets[name] }
  }

  /** 将工作表转换为 JSON 数据，并应用表头映射 */
  private static sheetToJson(
    worksheet: XLSX.WorkSheet,
    options: ReadExcelOptions,
    expectedHeaders: string[]
  ): { data: Array<Record<string, unknown>>; headers: string[] } {
    const headerMapping = options.headerMapping ?? {}
    const hasMapping = Object.keys(headerMapping).length > 0
    const skipHeader = options.skipHeader !== false

    // 以二维数组形式读取全部行（含表头），手动控制表头与数据行
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: options.defval,
      raw: options.raw
    })

    let headers: string[]
    let dataRows: unknown[][]

    if (expectedHeaders.length > 0) {
      headers = [...expectedHeaders]
      dataRows = skipHeader ? rows.slice(1) : rows
    } else if (rows.length > 0) {
      // 无预期表头时，以首行为表头，其余行为数据
      headers = rows[0].map((cell) => String(cell ?? ''))
      dataRows = rows.slice(1)
    } else {
      headers = []
      dataRows = []
    }

    // 按列索引将数据行组装为对象
    let data = dataRows.map((row) => {
      const record: Record<string, unknown> = {}
      headers.forEach((key, index) => {
        record[key] = row[index]
      })
      return record
    })

    // 应用表头映射（如果提供了映射关系）
    if (hasMapping) {
      data = data.map((row) => {
        const mappedRow: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(row)) {
          mappedRow[headerMapping[key] ?? key] = value
        }
        return mappedRow
      })
      headers = headers.map((header) => headerMapping[header] ?? header)
    }

    return { data, headers }
  }

  /** 将数据统一规范为二维数组（aoa），保证列顺序与表头一致 */
  private static toAoa(data: unknown[], headers: string[]): unknown[][] {
    if (data.length === 0) {
      return headers.length > 0 ? [headers] : []
    }

    // 已是二维数组，直接使用
    if (isAoa(data)) {
      return data as unknown[][]
    }

    // 对象数组：表头由 headers 指定，否则取所有键的并集
    const rows = data as Array<Record<string, unknown>>
    const keys =
      headers.length > 0 ? [...headers] : this.collectKeys(rows)

    return [keys, ...rows.map((row) => keys.map((key) => row[key]))]
  }

  /** 收集对象数组中所有键（去重，保持首次出现顺序） */
  private static collectKeys(rows: Array<Record<string, unknown>>): string[] {
    const seen = new Set<string>()
    const keys: string[] = []
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key)
          keys.push(key)
        }
      }
    }
    return keys
  }
}

export { ExcelImporter }

export default ExcelImporter
