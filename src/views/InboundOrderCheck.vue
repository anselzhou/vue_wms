<template>
  <div class="inbound-check-container">
    <el-card class="inbound-check-card" shadow="never">
      <!-- ==================== 顶部标题区 ==================== -->
      <template #header>
        <div class="card-header">
          <h2 class="card-title">入库订单信息核对</h2>
          <div class="header-actions">
            <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
            <el-button :icon="Refresh" :loading="detailLoading" @click="loadOrderDetail">刷新</el-button>
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

      <!-- 无权限提示 -->
      <el-result
        v-if="!pagePermission"
        icon="warning"
        title="暂无操作权限"
        sub-title="当前账号不具备入库操作权限，请联系管理员授权后重试"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </template>
      </el-result>

      <!-- ==================== 加载中 ==================== -->
      <div v-else-if="detailLoading" v-loading="detailLoading" class="loading-box">
        <span>正在加载入库订单明细...</span>
      </div>

      <!-- ==================== 加载失败（订单不存在/网络异常） ==================== -->
      <el-result
        v-else-if="loadFailed"
        icon="error"
        :title="orderNotFound ? '入库订单不存在' : '加载入库订单失败'"
        :sub-title="orderNotFound ? '该订单可能已被删除，请返回列表重新选择' : '请检查网络连接后重试'"
      >
        <template #extra>
          <el-button type="primary" @click="loadOrderDetail">重新加载</el-button>
          <el-button @click="goBack">返回列表</el-button>
        </template>
      </el-result>

      <!-- ==================== 订单信息与核对主区 ==================== -->
      <template v-else-if="order">
        <!-- 订单基本信息 -->
        <div class="section">
          <h3 class="section-title">订单信息</h3>
          <el-descriptions :column="3" border class="order-info">
            <el-descriptions-item label="订单编号">
              <el-tag type="info" size="small">{{ order.orderNo }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单类型">{{ orderTypeText(order.orderType) }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ order.supplier || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计划总量">
              <el-tag type="primary" effect="plain">{{ order.totalQuantity }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="入库日期">{{ formatTime(order.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="order.status === 'COMPLETED' ? 'success' : 'warning'">
                {{ statusText(order.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ order.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider />

        <!-- ==================== 核对进度 ==================== -->
        <div class="section">
          <div class="progress-header">
            <h3 class="section-title">物料明细核对</h3>
            <div class="progress-info">
              <span class="progress-stats">
                已核对 <b class="progress-done">{{ checkedCount }}</b> / 总物料
                <b class="progress-total">{{ order.items?.length ?? 0 }}</b>
                项
              </span>
              <el-tag v-if="allChecked" type="success" effect="plain" size="large">
                ✅ 全部核对完成
              </el-tag>
              <el-tag v-else type="warning" effect="plain" size="large">
                待核对 {{ pendingCount }} 项
              </el-tag>
            </div>
          </div>
          <el-progress
            :percentage="progressPercent"
            :stroke-width="16"
            :format="progressText"
            :status="allChecked && !hasDiff ? 'success' : undefined"
          />
        </div>

        <el-divider />

        <!-- ==================== 扫码/输入区 ==================== -->
        <div class="section scan-section">
          <h3 class="section-title">实际到货扫码比对</h3>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="scan-tip"
            title="扫描或输入实际到货的物料编码，系统将自动与订单明细逐项比对；匹配项高亮为“一致”，不匹配项将提示差异并禁止提交。"
          />
          <div class="scan-area">
            <el-input
              ref="scanInputRef"
              v-model="scanValue"
              placeholder="扫描/输入实际物料编码后回车比对"
              size="large"
              clearable
              :prefix-icon="Search"
              :disabled="allChecked"
              @keyup.enter="handleScanCompare"
            >
              <template #append>
                <el-button :icon="Check" :disabled="allChecked" @click="handleScanCompare">
                  比对
                </el-button>
              </template>
            </el-input>
          </div>
        </div>

        <el-divider />

        <!-- ==================== 物料明细表格 ==================== -->
        <div class="section table-section">
          <div class="table-header">
            <h3 class="section-title">物料明细</h3>
            <div class="table-header-right">
              <span v-if="hasDiff" class="diff-count-text">
                共 <b class="diff-count">{{ diffCount }}</b> 项差异
              </span>
            </div>
          </div>

          <el-table
            :data="order.items"
            stripe
            border
            style="width: 100%"
            :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
            :row-class-name="tableRowClassName"
            max-height="520"
          >
            <!-- 空状态 -->
            <template #empty>
              <el-empty description="该订单暂无物料明细" :image-size="80" />
            </template>

            <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />

            <el-table-column prop="material" label="物料编码" min-width="130" fixed="left">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.material }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="ean" label="EAN/条码" min-width="130">
              <template #default="{ row }">
                {{ row.ean || '-' }}
              </template>
            </el-table-column>

            <el-table-column prop="position" label="规格型号/库位" min-width="120">
              <template #default="{ row }">
                {{ specText(row) }}
              </template>
            </el-table-column>

            <el-table-column label="计划入库数量" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="primary" effect="plain">{{ row.quantity }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="已入库数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="info" effect="plain">{{ receivedQuantity(row) }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="待入库数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="warning" effect="plain">{{ pendingQuantity(row) }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="核对状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag
                  v-if="row._checked"
                  :type="row._checkResult === 'MATCHED' ? 'success' : 'danger'"
                  effect="dark"
                  size="small"
                >
                  {{ row._checkResult === 'MATCHED' ? '一致' : '差异' }}
                </el-tag>
                <el-tag v-else type="info" effect="plain" size="small">未核对</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="实际入库数量" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-input-number
                  v-model="row._actualQuantity"
                  :min="0"
                  :max="row.quantity"
                  :disabled="!canInputQuantity(row)"
                  size="small"
                  controls-position="right"
                  style="width: 120px"
                  @change="handleQuantityChange(row)"
                />
              </template>
            </el-table-column>

            <el-table-column label="差异说明" min-width="180" fixed="right">
              <template #default="{ row }">
                <span v-if="row._checkResult === 'DIFF'" class="diff-desc">
                  <el-icon class="diff-warn-icon"><WarningFilled /></el-icon>
                  {{ row._diffDescription || '输入的物料编码与订单不一致' }}
                </span>
                <span v-else class="diff-desc-empty">-</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <template v-if="!row._checked">
                  <el-button
                    type="success"
                    size="small"
                    :icon="Check"
                    @click="markMatched(row)"
                  >
                    标记一致
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    :icon="WarningFilled"
                    @click="markDiff(row)"
                  >
                    标记差异
                  </el-button>
                </template>
                <el-button
                  v-else
                  type="info"
                  size="small"
                  text
                  @click="resetRow(row)"
                >
                  重新核对
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- ==================== 差异提示（外来编码） ==================== -->
        <el-alert
          v-if="unmatchedScanCodes.length > 0"
          type="error"
          show-icon
          :closable="false"
          class="unmatched-alert"
          title="检测到订单外物料编码"
        >
          <template #default>
            <div class="unmatched-codes">
              以下扫描编码与订单明细不一致，已列入差异报告，禁止作为正常入库提交：
              <el-tag
                v-for="code in unmatchedScanCodes"
                :key="code"
                type="danger"
                size="small"
                class="unmatched-tag"
              >
                {{ code }}
              </el-tag>
            </div>
          </template>
        </el-alert>

        <el-divider />

        <!-- ==================== 差异报告预览 ==================== -->
        <div v-if="diffItems.length > 0" class="section">
          <h3 class="section-title">
            入库差异报告
            <el-tag type="danger" size="small" class="diff-tag">共 {{ diffItems.length }} 项</el-tag>
          </h3>
          <el-table
            :data="diffItems"
            stripe
            border
            size="small"
            style="width: 100%"
            :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--wms-text-secondary)', fontWeight: 600 }"
          >
            <el-table-column prop="orderNo" label="订单编码" min-width="160">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.orderNo }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="material" label="不一致物料编码" min-width="140">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.material }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="diffDescription" label="差异说明" min-width="200" />
          </el-table>
        </div>

        <el-divider v-if="order.items && order.items.length > 0" />

        <!-- ==================== 底部操作 ==================== -->
        <div class="bottom-actions">
          <el-button
            type="primary"
            size="large"
            :icon="Check"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmitCheck"
          >
            提交核对结果
          </el-button>
          <span v-if="!canSubmit && order.items?.length" class="submit-hint">
            请先完成所有物料明细核对{{ hasDiff ? '，并确认差异项' : '' }}后再提交
          </span>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, ArrowLeft, WarningFilled } from '@element-plus/icons-vue'
import {
  getInboundDetail,
  getInboundDetailByNo,
  getInboundOrderItems,
  updateInboundStatus,
  submitInboundCheck,
  type InboundOrderResponse,
  type InboundOrderItemResponse,
  type InboundCheckItemPayload,
  type InboundDiffReportItem
} from '@/api/inbound'
import { hasPermission } from '@/utils/permission'
import { playCorrect, playError } from '@/utils/sound'

const route = useRoute()
const router = useRouter()

/** 页面访问权限（meta 已由路由守卫校验，此处二次防御） */
const pagePermission = computed(() => hasPermission(['inbound:page']))

// ==================== 状态 ====================

const order = ref<InboundOrderResponse | null>(null)
const detailLoading = ref(false)
const loadFailed = ref(false)
const orderNotFound = ref(false)
const globalErrorMsg = ref('')

const scanValue = ref('')
const scanInputRef = ref()
const submitting = ref(false)

/** 扫描到的订单外物料编码集合（用于差异报告与提示） */
const unmatchedScanCodes = ref<string[]>([])

/** 订单 ID（从路由 query 获取） */
const orderId = computed(() => Number(route.query.id) || 0)
/** 订单号（从路由 query 获取，兼容直达链接） */
const queryOrderNo = computed(() => String(route.query.orderNo || ''))

// ==================== 类型扩展（明细行附加核对字段） ====================

/** 核对行类型：订单明细 + 前端核对状态 */
type CheckRow = InboundOrderItemResponse & {
  /** 是否已核对 */
  _checked: boolean
  /** 核对结果：MATCHED 一致 / DIFF 差异 */
  _checkResult: 'MATCHED' | 'DIFF' | ''
  /** 实际入库数量 */
  _actualQuantity: number
  /** 差异说明 */
  _diffDescription: string
}

// ==================== 工具函数 ====================

const statusText = (status?: string): string => {
  if (!status) return '-'
  const s = status.trim()
  if (s === 'COMPLETED' || s === '已完成' || s === '已入库') return '已完成'
  if (s === 'CANCELLED' || s === '已取消') return '已取消'
  return '待入库'
}

/** 判断是否为待入库状态（兼容中英文） */
const isPendingStatus = (status?: string): boolean => {
  if (!status) return false
  const s = status.trim()
  return s === 'PENDING' || s === '待入库'
}

const orderTypeText = (type?: string): string => {
  if (!type) return '-'
  const t = type.trim()
  const map: Record<string, string> = {
    NORMAL: '普通入库',
    采购入库: '采购入库',
    退货入库: '退货入库',
    调拨入库: '调拨入库',
    其他入库: '其他入库'
  }
  return map[t] || t
}

const formatTime = (time?: string): string => {
  if (!time) return '-'
  return time.replace('T', ' ')
}

/** 规格型号（订单明细没有规格字段时回退展示库位） */
const specText = (row: CheckRow): string => {
  return (row as any).specification || (row as any).model || (row as any).spec || row.position || '-'
}

/** 已入库数量：核对一致的按实际数量计算，否则按原已入库数量（明细无独立字段时按核对状态推导） */
const receivedQuantity = (row: CheckRow): number => {
  if (row._checked && row._checkResult === 'MATCHED') {
    return row._actualQuantity
  }
  return (row as any).receivedQuantity ?? 0
}

/** 待入库数量 = 计划数量 - 已入库数量（已核对一致时为 0） */
const pendingQuantity = (row: CheckRow): number => {
  if (row._checked && row._checkResult === 'MATCHED') {
    return Math.max(0, row.quantity - row._actualQuantity)
  }
  const received = (row as any).receivedQuantity ?? 0
  return Math.max(0, row.quantity - received)
}

/** 明细行是否允许输入实际数量：仅已核对且一致的行可输入 */
const canInputQuantity = (row: CheckRow): boolean => {
  return row._checked && row._checkResult === 'MATCHED'
}

// ==================== 派生状态 ====================

const checkRows = computed<CheckRow[]>(() => (order.value?.items as CheckRow[]) || [])

const checkedCount = computed(() => checkRows.value.filter((i) => i._checked).length)
const pendingCount = computed(() => checkRows.value.length - checkedCount.value)
const diffCount = computed(() => checkRows.value.filter((i) => i._checkResult === 'DIFF').length)
const hasDiff = computed(() => diffCount.value > 0 || unmatchedScanCodes.value.length > 0)

const totalCount = computed(() => checkRows.value.length)

/** 全部核对完成 */
const allChecked = computed(() => {
  return totalCount.value > 0 && checkRows.value.every((i) => i._checked)
})

/** 进度百分比 */
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((checkedCount.value / totalCount.value) * 100)
})

const progressText = (percent: number): string => {
  return `${checkedCount.value}/${totalCount.value} 项（${percent}%）`
}

/** 是否可提交：全部核对完成（无论是否一致，差异项已标记且禁止输入数量） */
const canSubmit = computed(() => {
  return totalCount.value > 0 && allChecked.value && !submitting.value
})

/** 差异报告条目（含订单内差异行 + 订单外扫描编码） */
const diffItems = computed<InboundDiffReportItem[]>(() => {
  const orderNo = order.value?.orderNo || queryOrderNo.value

  // 订单内被标记为差异的行
  const orderDiffItems = checkRows.value
    .filter((i) => i._checkResult === 'DIFF')
    .map((i) => ({
      orderNo,
      material: i.material,
      diffDescription: i._diffDescription || '输入的物料编码与订单不一致'
    }))

  // 订单外扫描到的物料编码
  const unmatchedItems = unmatchedScanCodes.value.map((code) => ({
    orderNo,
    material: code,
    diffDescription: '扫描的物料编码不在订单明细中'
  }))

  return [...orderDiffItems, ...unmatchedItems]
})

// ==================== 数据加载 ====================

/**
 * 加载订单明细：
 * 1. 优先按 ID 调用 detail 接口（含明细）
 * 2. 明细为空时回退调用 items 接口
 * 3. 无 ID 时尝试按订单号查询
 */
const loadOrderDetail = async () => {
  detailLoading.value = true
  loadFailed.value = false
  orderNotFound.value = false
  globalErrorMsg.value = ''

  try {
    let loadedOrder: InboundOrderResponse | null = null

    // 尝试按 ID 加载
    if (orderId.value > 0) {
      try {
        const resp = await getInboundDetail(orderId.value)
        loadedOrder = resp?.data || null
      } catch (error: any) {
        // 业务错误：订单不存在
        if (error?.isBusinessError) {
          orderNotFound.value = true
        }
      }
    }

    // ID 加载失败或不存在时，尝试按订单号加载
    if (!loadedOrder && queryOrderNo.value) {
      const resp: any = await getInboundDetailByNo(queryOrderNo.value)
      loadedOrder = resp?.data || null
    }

    // 仍未加载到订单
    if (!loadedOrder) {
      orderNotFound.value = true
      loadFailed.value = true
      globalErrorMsg.value = '未找到该入库订单，可能已被删除或无权访问'
      return
    }

    // 状态二次校验：仅待入库订单可核对（防止绕过列表页直达）
    if (!isPendingStatus(loadedOrder.status)) {
      loadFailed.value = true
      orderNotFound.value = true
      globalErrorMsg.value = `订单 ${loadedOrder.orderNo} 当前状态为「${statusText(loadedOrder.status)}」，仅待入库订单可进行核对入库`
      return
    }

    // 明细为空时回退拉取
    if (!loadedOrder.items || loadedOrder.items.length === 0) {
      const itemsResp = await getInboundOrderItems(loadedOrder.id)
      loadedOrder.items = Array.isArray(itemsResp?.data) ? itemsResp.data : []
    }

    // 初始化核对状态
    loadedOrder.items = initializeCheckRows(loadedOrder.items || [])

    order.value = loadedOrder
    globalErrorMsg.value = ''
  } catch (error: any) {
    loadFailed.value = true
    const msg =
      error?.isBusinessError
        ? error?.message || '加载入库订单失败'
        : error?.code === 'ECONNABORTED'
          ? '请求超时，请检查网络连接'
          : '网络异常，请检查网络连接后重试'
    globalErrorMsg.value = msg
  } finally {
    detailLoading.value = false
  }
}

/** 为明细行附加核对状态字段 */
const initializeCheckRows = (items: InboundOrderItemResponse[]): CheckRow[] => {
  return items.map((item) => ({
    ...item,
    _checked: false,
    _checkResult: '' as const,
    _actualQuantity: 0,
    _diffDescription: ''
  }))
}

// ==================== 扫码比对 ====================

/**
 * 扫码/输入比对：
 * - 匹配（不区分大小写、忽略首尾空白）：高亮该行并标记「一致」，允许输入实际数量
 * - 不匹配：高亮差异行，给出差异警告，禁止提交该条物料
 */
const handleScanCompare = () => {
  const value = scanValue.value.trim()
  if (!value) {
    ElMessage.warning('请扫描或输入实际物料编码')
    playError()
    return
  }

  if (allChecked.value) {
    ElMessage.info('本订单所有物料均已核对完成')
    playError()
    scanValue.value = ''
    return
  }

  // 遍历查找未核对的匹配项
  const target = checkRows.value.find(
    (i) => !i._checked && i.material.toUpperCase() === value.toUpperCase()
  )

  if (target) {
    // ===== 匹配：标记为一致，允许输入实际数量 =====
    target._checked = true
    target._checkResult = 'MATCHED'
    target._actualQuantity = target.quantity
    target._diffDescription = ''
    ElMessage.success(`物料 ${target.material} 与订单一致`)
    playCorrect()
    scanValue.value = ''
    nextTick(() => focusScanInput())
    return
  }

  // ===== 不匹配：差异警告 =====
  // 记录外来编码（订单外物料），避免重复记录
  if (!unmatchedScanCodes.value.includes(value)) {
    unmatchedScanCodes.value.push(value)
  }

  ElMessage.error(`输入的物料编码「${value}」与订单不一致，请重新核对`)
  playError()

  // 同时将第一个未核对的行标记为差异（便于用户定位；外来编码单独记录于 unmatchedScanCodes）
  const firstUnchecked = checkRows.value.find((i) => !i._checked)
  if (firstUnchecked) {
    firstUnchecked._checked = true
    firstUnchecked._checkResult = 'DIFF'
    firstUnchecked._actualQuantity = 0
    firstUnchecked._diffDescription = `输入的物料编码与订单不一致（${value}）`
  }

  scanValue.value = ''
}

/** 逐项标记：标记为一致（默认按计划数量作为实际数量） */
const markMatched = (row: CheckRow) => {
  row._checked = true
  row._checkResult = 'MATCHED'
  row._actualQuantity = row.quantity
  row._diffDescription = ''
  ElMessage.success(`物料 ${row.material} 已标记为一致`)
}

/** 逐项标记：标记为差异（禁止输入数量） */
const markDiff = (row: CheckRow) => {
  row._checked = true
  row._checkResult = 'DIFF'
  row._actualQuantity = 0
  row._diffDescription = '人工标记：实际到货与订单不一致'
  ElMessage.warning(`物料 ${row.material} 已标记为差异`)
}

/** 重置单项核对结果（允许重新核对） */
const resetRow = (row: CheckRow) => {
  row._checked = false
  row._checkResult = ''
  row._actualQuantity = 0
  row._diffDescription = ''
}

/** 数量变更后重算待入库数量（进度基于已核对项数，无需额外处理） */
const handleQuantityChange = (row: CheckRow) => {
  if (!row._checked) return
  if (row._actualQuantity < 0) row._actualQuantity = 0
  if (row._actualQuantity > row.quantity) row._actualQuantity = row.quantity
}

// ==================== 表格行样式 ====================

const tableRowClassName = ({ row }: { row: CheckRow }): string => {
  if (!row._checked) return ''
  return row._checkResult === 'MATCHED' ? 'matched-row' : 'diff-row'
}

// ==================== 提交 ====================

/**
 * 提交核对结果：
 * 1. 校验全部核对完成
 * 2. 存在未处理差异项时弹出二次确认
 * 3. 生成差异报告并提交后端
 */
const handleSubmitCheck = async () => {
  const currentOrder = order.value
  if (!currentOrder) return

  // 校验全部核对完成
  if (!allChecked.value) {
    ElMessage.warning(`尚有 ${pendingCount.value} 项物料未核对，请先完成全部核对`)
    return
  }

  // 差异项二次确认
  if (hasDiff.value) {
    try {
      await ElMessageBox.confirm(
        `核对过程中存在 ${diffCount.value} 项未处理的差异（物料编码与订单不一致），提交后将生成入库差异报告并保存。是否确认提交？`,
        '⚠️ 存在差异项',
        {
          confirmButtonText: '确认提交',
          cancelButtonText: '返回核对',
          type: 'warning',
          center: true
        }
      )
    } catch {
      return
    }
  }

  // 组装提交数据
  const items: InboundCheckItemPayload[] = checkRows.value.map((row) => ({
    itemId: row.id,
    material: row.material,
    ean: row.ean || '',
    plannedQuantity: row.quantity,
    actualQuantity: row._checkResult === 'MATCHED' ? row._actualQuantity : 0,
    checkResult: row._checkResult === 'MATCHED' ? 'MATCHED' : 'DIFF',
    diffDescription: row._checkResult === 'DIFF' ? row._diffDescription : undefined
  }))

  const payload = {
    orderId: currentOrder.id,
    orderNo: currentOrder.orderNo,
    items,
    diffReport: diffItems.value
  }

  submitting.value = true
  try {
    const resp = await submitInboundCheck(payload)
    if (resp?.code === 200) {
      ElMessage.success('核对结果已提交，差异报告已保存')
      // 更新订单状态为已完成
      await updateInboundStatus(currentOrder.id, 'COMPLETED').catch(() => {
        // 状态更新失败不阻塞主流程
        console.warn('更新入库订单状态失败')
      })
      // 延迟返回列表
      setTimeout(() => {
        router.push('/inbound-management/inbound-by-order')
      }, 1200)
    } else {
      globalErrorMsg.value = resp?.message || '提交核对结果失败'
    }
  } catch (error: any) {
    globalErrorMsg.value =
      error?.isBusinessError
        ? error?.message || '提交核对结果失败'
        : error?.code === 'ECONNABORTED'
          ? '请求超时，请检查网络连接'
          : '网络异常，请检查网络连接后重试'
  } finally {
    submitting.value = false
  }
}

// ==================== 导航 ====================

const goBack = () => {
  router.push('/inbound-management/inbound-by-order')
}

const focusScanInput = () => {
  scanInputRef.value?.focus?.()
}

// ==================== 初始化 ====================

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.inbound-check-container {
  padding: 20px;
}

.inbound-check-card {
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

/* ===== 订单信息 ===== */
.order-info {
  margin-top: 8px;
}

/* ===== 进度区 ===== */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-header .section-title {
  margin: 0;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.progress-stats {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.progress-done {
  color: var(--el-color-success);
  font-size: 18px;
}

.progress-total {
  color: var(--el-color-primary);
  font-size: 18px;
}

/* ===== 扫码区 ===== */
.scan-tip {
  margin-bottom: 12px;
}

.scan-area {
  max-width: 720px;
}

/* ===== 表格 ===== */
.table-section {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.table-header .section-title {
  margin: 0;
}

.table-header-right {
  display: flex;
  align-items: center;
}

.diff-count-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.diff-count {
  color: var(--el-color-danger);
  font-size: 16px;
}

/* 一致行高亮 */
:deep(.el-table .matched-row) {
  background-color: rgba(103, 194, 58, 0.12);
}

:deep(.el-table .matched-row:hover > td) {
  background-color: rgba(103, 194, 58, 0.2);
}

/* 差异行高亮 */
:deep(.el-table .diff-row) {
  background-color: rgba(245, 108, 108, 0.15);
}

:deep(.el-table .diff-row:hover > td) {
  background-color: rgba(245, 108, 108, 0.25);
}

.diff-desc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-danger);
  font-size: 13px;
}

.diff-warn-icon {
  flex-shrink: 0;
}

.diff-desc-empty {
  color: var(--el-text-color-placeholder);
}

/* ===== 外来编码提示 ===== */
.unmatched-alert {
  margin: 16px 0 0;
}

.unmatched-codes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  line-height: 1.8;
}

.unmatched-tag {
  margin: 0;
}

/* ===== 差异报告 ===== */
.diff-tag {
  margin-left: 8px;
  vertical-align: middle;
}

/* ===== 底部操作 ===== */
.bottom-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.submit-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ===== 加载 ===== */
.loading-box {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .inbound-check-container {
    padding: 12px;
  }

  .card-title {
    font-size: 18px;
  }

  .section-title {
    font-size: 15px;
  }

  .progress-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .scan-area {
    max-width: 100%;
  }

  .bottom-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .bottom-actions .el-button {
    width: 100%;
  }
}
</style>
