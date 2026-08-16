// src/utils/ExcelExporter.ts
import * as XLSX from 'xlsx'

/** 字段配置：对象形式支持自定义表头与格式化 */
interface FieldConfig {
  label: string
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown
}

/** 字段映射：字段名 -> 表头名称 或 字段配置 */
type FieldMap = Record<string, string | FieldConfig>

/** 导出配置 */
interface ExportOptions {
  fileName?: string
  sheetName?: string
  autoWidth?: boolean
  headerCellStyle?: Record<string, unknown>
}

/** 导出结果 */
interface ExportResult {
  success: boolean
  message: string
  exportedCount: number
}

/** 规范化后的字段描述 */
interface NormalizedField {
  field: string
  label: string
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown
}

/** 默认配置 */
const DEFAULT_OPTIONS: Required<ExportOptions> = {
  fileName: '导出数据.xlsx',
  sheetName: 'Sheet1',
  autoWidth: true,
  headerCellStyle: {
    fill: { fgColor: { rgb: 'FFCCCCCC' } },
    font: { bold: true }
  }
}

/** Excel 工作表名非法字符 */
const SHEET_NAME_INVALID_CHARS = /[\\/?*[\]:]/g
/** 工作表名最大长度 */
const MAX_SHEET_NAME_LENGTH = 31
/** 单列最大宽度上限（字符单位） */
const MAX_COLUMN_WIDTH = 100

/** 计算字符串在 Excel 中的显示宽度（ASCII 计 1，其余计 2） */
function getDisplayWidth(text: string): number {
  let width = 0
  for (const char of text) {
    width += char.charCodeAt(0) > 255 ? 2 : 1
  }
  return width
}

/** 清洗工作表名称，移除 Excel 不允许的字符并限制长度 */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(SHEET_NAME_INVALID_CHARS, ' ').trim()
  return (cleaned || 'Sheet1').slice(0, MAX_SHEET_NAME_LENGTH)
}

/** 确保文件名以 .xlsx 结尾 */
function ensureXlsxExtension(fileName: string): string {
  return /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`
}

/**
 * Excel 导出工具类
 * 支持自定义表头、数据转换、自动列宽与表头样式
 */
class ExcelExporter {
  private options: Required<ExportOptions>

  constructor(options: ExportOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 将数据导出为 Excel 文件
   * @param data - 数据源（对象数组）
   * @param fields - 字段映射 { 字段名: 表头名称 | 字段配置 }
   * @param options - 导出配置（可选）
   */
  exportToExcel(
    data: Array<Record<string, unknown>>,
    fields: FieldMap,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const opts: Required<ExportOptions> = { ...this.options, ...options }

      if (!Array.isArray(data)) {
        throw new Error('导出数据必须是数组')
      }
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
        throw new Error('字段映射配置无效')
      }

      const normalized = this.normalizeFields(fields)
      if (normalized.length === 0) {
        throw new Error('字段映射不能为空')
      }

      const { headers, rows } = this.prepareData(data, normalized)

      // 表头 + 数据 二维数组，保证列顺序与表头一致
      const aoa: unknown[][] = [
        headers,
        ...rows.map((row) => headers.map((header) => row[header]))
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(aoa)

      if (opts.autoWidth) {
        this.setAutoWidth(worksheet, headers, rows)
      }

      // 注意：SheetJS 社区版（xlsx@0.18.5）写入时忽略 cellStyles，
      // 样式需 Pro 版才真正生效，此处保留配置以便将来升级。
      if (opts.headerCellStyle) {
        this.setHeaderStyle(worksheet, headers, opts.headerCellStyle)
      }

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sanitizeSheetName(opts.sheetName)
      )

      XLSX.writeFile(workbook, ensureXlsxExtension(opts.fileName), {
        bookType: 'xlsx',
        cellDates: true
      })

      return Promise.resolve({
        success: true,
        message: '导出成功',
        exportedCount: rows.length
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return Promise.reject(new Error(`导出失败: ${message}`))
    }
  }

  /** 规范化字段映射，统一为 { field, label, formatter } 结构 */
  private normalizeFields(fields: FieldMap): NormalizedField[] {
    return Object.keys(fields).map((field) => {
      const config = fields[field]
      if (typeof config === 'string') {
        return { field, label: config }
      }
      if (config && typeof config === 'object') {
        return {
          field,
          label: config.label ?? String(field),
          formatter: config.formatter
        }
      }
      return { field, label: String(field) }
    })
  }

  /** 准备表头与数据行，保证 headers 与 rows 的键一致 */
  private prepareData(
    data: Array<Record<string, unknown>>,
    normalized: NormalizedField[]
  ): { headers: string[]; rows: Array<Record<string, unknown>> } {
    const headers = normalized.map((item) => item.label)

    const rows = data.map((item) => {
      const row: Record<string, unknown> = {}
      for (const { field, label, formatter } of normalized) {
        const value = item[field]
        row[label] = formatter ? formatter(value, item) : value
      }
      return row
    })

    return { headers, rows }
  }

  /** 设置自动列宽 */
  private setAutoWidth(
    worksheet: XLSX.WorkSheet,
    headers: string[],
    rows: Array<Record<string, unknown>>
  ): void {
    // 初始宽度取表头显示宽度 + 内边距
    const widths = headers.map((header) => getDisplayWidth(header) + 2)

    for (const row of rows) {
      for (let i = 0; i < headers.length; i++) {
        const value = row[headers[i]]
        if (value == null) continue
        const width = getDisplayWidth(String(value)) + 2
        if (width > widths[i]) {
          widths[i] = width
        }
      }
    }

    worksheet['!cols'] = headers.map((_, index) => ({
      wch: Math.min(widths[index], MAX_COLUMN_WIDTH)
    }))
  }

  /** 设置表头样式 */
  private setHeaderStyle(
    worksheet: XLSX.WorkSheet,
    headers: string[],
    style: Record<string, unknown>
  ): void {
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c })
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = style
      }
    }
  }

  /** 创建导入模板 */
  createTemplate(
    fields: FieldMap,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const templateData = this.createTemplateData(fields)
    return this.exportToExcel(templateData, fields, {
      ...this.options,
      ...options,
      fileName: options.fileName ?? '导入模板.xlsx'
    })
  }

  /** 生成模板示例数据 */
  private createTemplateData(
    fields: FieldMap
  ): Array<Record<string, unknown>> {
    const templateRow: Record<string, unknown> = {}
    Object.keys(fields).forEach((field) => {
      const config = fields[field]
      const header =
        typeof config === 'object' && config !== null
          ? config.label
          : config
      templateRow[field] = `请输入${header}`
    })
    return [templateRow]
  }
}

// 创建默认实例
const excelExporter = new ExcelExporter()

export { ExcelExporter, excelExporter }

/** 导出快捷方法 */
export const exportToExcel = (
  data: Array<Record<string, unknown>>,
  fields: FieldMap,
  options?: ExportOptions
): Promise<ExportResult> => excelExporter.exportToExcel(data, fields, options)

/** 创建模板快捷方法 */
export const createExcelTemplate = (
  fields: FieldMap,
  options?: ExportOptions
): Promise<ExportResult> => excelExporter.createTemplate(fields, options)
