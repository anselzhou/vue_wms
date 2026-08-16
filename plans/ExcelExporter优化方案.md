# ExcelExporter.ts 全面错误检查与优化方案

## 一、问题清单（逐项）

### 1. 致命语法错误（导致无法编译）
`src/utils/ExcelExporter.ts:152-170` 的 `setHeaderStyle` 方法体被压缩成一行，存在：
- 两个 `const` 声明之间缺少分号：`const cellAddress={...} const cellRef=...` 非法；
- 方法缺少闭合大括号，导致后续 `createTemplate`、`createTemplateData` 被错误嵌套进方法体；
- 文件末尾示例代码被 `/** ... */` 包裹但内容含有 `<template>`、`<script setup>` 等标签，干扰 IDE 与编辑器解析。

### 2. 运行时异常：未安装的依赖
`src/utils/ExcelExporter.ts:2` 引入 `file-saver`，但 `package.json` 中无该依赖，`saveAs` 在运行时为 `undefined`，调用即抛 `TypeError`。项目已依赖 `xlsx@0.18.5`，其自带 `XLSX.writeFile`，无需额外依赖。

### 3. 逻辑错误：`setHeaderStyle` 签名与调用不一致
定义 `setHeaderStyle(worksheet, headers)`（2 参），调用处传 3 参 `(worksheet, headers, opts.headerCellStyle)`，且方法内部硬编码使用 `this.options.headerCellStyle`，导致调用方传入的自定义样式被忽略。

### 4. 逻辑错误：表头数组与数据键不一致
`prepareData` 中 `headers = Object.values(fields)`。当字段为对象形式 `{ label, formatter }` 时，`Object.values` 取到的是对象本身而非 `label` 字符串，而数据行 `row[label] = ...` 以 `label` 为键。结果是：
- 表头 `headers` 里是对象；
- `setAutoWidth` 用 `row[header]` 索引，键被强转为 `"[object Object]"`，永远取到 `undefined`，自动列宽对对象字段完全失效。

### 5. 边界条件：空表 / 空字段
- `data = []` 时 `json_to_sheet([])` 生成空表，`worksheet['!ref']` 为 `undefined`，`decode_range(undefined)` 抛异常；
- `fields` 为 `null`/`undefined`/空对象时直接 `Object.values` 抛异常；
- `fields[field]` 为 `null` 时 `typeof null === 'object'` 为真，随后 `const { label, formatter } = null` 抛异常。

### 6. 逻辑错误：`createTemplate` 未返回值
`createTemplate` 调用 `this.exportToExcel(...)` 但无 `return`，导致 `createExcelTemplate` 返回 `undefined`，调用方无法 `await`。

### 7. 逻辑错误：模板默认文件名永不生效
`createTemplate` 中 `fileName: opts.fileName || '导入模板.xlsx'`，而 `opts.fileName` 由 `this.options` 合并后默认已为 `'导出数据.xlsx'`，`||` 分支永远不触发。

### 8. 健壮性：工作表名 / 文件名未校验
- Excel 工作表名不允许 `\ / ? * [ ] :` 等字符，且最大 31 字符，原代码未清洗；
- 文件名未补全 `.xlsx` 后缀。

### 9. 规范性问题
- 全文件无 TypeScript 类型注解（项目启用了 `noUnusedParameters` 等严格项），`any` 泛滥；
- `reject({success, message})` 传对象而非 `Error`，破坏错误契约；
- `String(cellValue).length * 10` 与 `Math.max(maxWidth/10, 10)` 宽度单位混乱，中文按 1 字符计导致列宽不足；
- 使用 `json_to_sheet` 依赖对象键插入顺序决定列顺序，存在不确定性。

### 10. 第三方限制提示
`XLSX.write` 的 `cellStyles: true` 在 SheetJS 社区版（`xlsx@0.18.5`）中不被支持，样式不会真正写入文件，需 Pro 版；保留配置并在注释中说明。

---

## 二、时间复杂度与空间复杂度分析

设数据行数 N，字段数 H（= 表头列数）。

| 环节 | 原实现 | 优化后 | 说明 |
|------|--------|--------|------|
| `prepareData` | O(N×H) | O(N×H) | 原实现每个 `map` 内重复 `Object.keys(fields)`；优化为预规范化字段，一次遍历 |
| 构建表 | O(N×H) | O(N×H) | 由 `json_to_sheet` 改为 `aoa_to_sheet`，列顺序稳定 |
| `setAutoWidth` | O(H×N) | O(N×H) | 原为 `headers.map` 内嵌 `data.forEach`（每列扫全表）；优化为单次遍历数据，累计各列最大宽度，消除重复函数调用与重复 `String()` 转换 |
| `setHeaderStyle` | O(H) | O(H) | 原依赖 `decode_range` 且对空表崩溃；改为按表头列数直接写第 0 行 |

**空间复杂度**：两者均为 O(N×H)（导出数据必然驻留内存）+ O(H)（列宽/表头辅助数组）。优化主要降低常数因子与 GC 压力，不改变渐近复杂度。

---

## 三、优化后完整代码

```typescript
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
```

---

## 四、逐项修改原因说明

| # | 修改 | 原因 |
|---|------|------|
| 1 | 移除 `file-saver`，改用 `XLSX.writeFile` | 依赖未安装会导致运行时崩溃；`xlsx` 已内置下载能力，减少一个依赖 |
| 2 | 修复 `setHeaderStyle` 签名与实现 | 签名只收 2 参却调用 3 参，且忽略传入样式；改为接收 `style` 参数，使用 `aoa_to_sheet` 保证表头恒在第 0 行 |
| 3 | `headers` 统一取 `label` | 修复对象字段下表头为对象、列宽索引失效的 bug |
| 4 | 新增 `normalizeFields` | 将字段映射一次规范化为 `{field,label,formatter}`，消除 `Object.keys` 重复遍历，并规避 `null` 解构崩溃 |
| 5 | `aoa_to_sheet` 替代 `json_to_sheet` | 列顺序与表头严格一致，且表头始终存在，空数据时 `!ref` 稳定，不再崩溃 |
| 6 | `createTemplate` 补 `return` | 原实现丢失 Promise 返回值，调用方无法 `await` |
| 7 | 模板文件名改为 `options.fileName ?? '导入模板.xlsx'` | 修复默认值被合并覆盖、永不生效的问题 |
| 8 | 新增 `sanitizeSheetName` / `ensureXlsxExtension` | 规避非法工作表名报错，自动补全文件扩展名 |
| 9 | 列宽改用 `getDisplayWidth` | 中文/全角字符按 2 宽计算，解决中文列宽不足；统一单位为字符宽，并加内边距与上限 |
| 10 | `setAutoWidth` 单次遍历数据 | 消除 `headers.map` 内嵌 `forEach` 的重复扫描与重复 `String()` 转换 |
| 11 | 完整 TypeScript 类型定义 | 项目开启严格检查，消除隐式 `any`；导出类型可供调用方复用 |
| 12 | `reject(new Error(...))` 替代 `reject({...})` | 遵循 `Promise` 错误契约，`catch` 得到真正的 `Error` 实例 |
| 13 | 增加数据/字段入参校验 | 提前暴露非法入参，避免深层 API 抛难懂的异常 |
| 14 | 删除文件末尾无效示例代码块 | 消除解析歧义，保留 JSDoc 精简注释 |
| 15 | 保留 `headerCellStyle` 配置并注明社区版限制 | 社区版 `xlsx` 忽略 `cellStyles`，代码不报错但样式不生效，注释说明避免误解 |

---

## 五、对比摘要

| 维度 | 原实现 | 优化后 |
|------|--------|--------|
| 可编译性 | 存在语法错误，无法通过 `vue-tsc` | 通过编译 |
| 依赖 | 引入未安装的 `file-saver` | 移除，复用 `xlsx` 内置能力 |
| 表头/列宽 | 对象字段下表头为对象，列宽失效 | 统一取 `label`，列宽正确 |
| 空数据 | `decode_range(undefined)` 崩溃 | 表头恒存在，正常导出 |
| 空字段/null | 抛异常 | 明确校验与兜底 |
| 模板导出 | 返回 `undefined`、默认名失效 | 正确返回 Promise、默认名生效 |
| 中文列宽 | 按 1 字符计算，偏窄 | 按 2 字符计算，加内边距与上限 |
| 类型安全 | 无类型，隐式 `any` | 完整接口与类型 |
| 错误契约 | `reject` 传对象 | `reject(Error)` |
| 文件名/表名 | 未校验 | 自动清洗非法字符、补扩展名 |
| 列顺序 | 依赖对象键顺序 | 由表头数组严格确定 |

---

## 六、数据流

```mermaid
flowchart LR
  A[data 数组] --> B[normalizeFields 规范化字段]
  F[fields 映射] --> B
  B --> C[prepareData 生成 headers 与 rows]
  C --> D[构建 aoa 二维数组]
  D --> E[aoa_to_sheet 生成工作表]
  E --> G{autoWidth}
  G -- 是 --> H[setAutoWidth 单次遍历算列宽]
  G -- 否 --> I
  H --> I{headerCellStyle}
  I -- 是 --> J[setHeaderStyle 写表头样式]
  I -- 否 --> K[book_new + append_sheet]
  J --> K
  K --> L[sanitizeSheetName 清洗表名]
  L --> M[writeFile 下载]
```
