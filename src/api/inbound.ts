import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

// ============================================================
// 库存记录（对应后端 com.example.wms.entity.Inventory）
// ============================================================

/** 库存记录 */
export interface InventoryItem {
  /** 库位 */
  position: string
  /** EAN 码（可空，后端入库存使用 position + material） */
  ean?: string
  /** 物料编码 */
  material: string
  /** 数量 */
  quantity: number
  /** 锁定数量（仅查询返回） */
  blockQuantity?: number
  /** 可用数量（仅查询返回） */
  availableQuantity?: number
}

// ============================================================
// 入库单明细项 — 请求体（对应 POST /inbound/create 的 items[]）
// ============================================================
export interface InboundOrderItemRequest {
  ean: string
  material: string
  quantity: number
  position?: string
}

// ============================================================
// 创建入库单 — 请求体（对应 POST /inbound/create）
// ============================================================
export interface CreateInboundOrderRequest {
  orderNo: string
  orderType?: string
  supplier?: string
  operatorId?: number
  status?: string
  remark?: string
  items: InboundOrderItemRequest[]
}

/** POST /inbound/create — 创建入库单 */
export function createInboundOrder(data: CreateInboundOrderRequest) {
  return request({
    url: '/inbound/create',
    method: 'post',
    data
  })
}

// ============================================================
// 入库单明细项 — 响应体
// ============================================================
export interface InboundOrderItemResponse {
  id: number
  orderId: number
  ean: string
  material: string
  quantity: number
  position: string
  status: string
  createTime: string
  updateTime: string
}

// ============================================================
// 入库单 — 响应体
// ============================================================
export interface InboundOrderResponse {
  id: number
  orderNo: string
  orderType: string
  supplier: string
  operatorId: number
  status: string
  totalQuantity: number
  remark: string
  createTime: string
  updateTime: string
  items: InboundOrderItemResponse[]
}

/** GET /inbound/list — 获取所有入库单（直接返回数组，无 Result 包裹） */
export function getInboundOrderList() {
  return request({
    url: '/inbound/list',
    method: 'get'
  })
}

/** GET /inbound/detail/{id} — 根据 ID 查询入库单 */
export function getInboundDetail(id: number) {
  return request({
    url: `/inbound/detail/${id}`,
    method: 'get'
  })
}

/** GET /inbound/detail/no/{orderNo} — 根据订单号查询入库单 */
export function getInboundDetailByNo(orderNo: string) {
  return request({
    url: `/inbound/detail/no/${orderNo}`,
    method: 'get'
  })
}

/** PUT /inbound/status/{id} — 更新入库单状态 */
export function updateInboundStatus(id: number, status: string) {
  return request({
    url: `/inbound/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// ============================================================
// 向下兼容的旧接口（供 CreateInboundOrder.vue 等使用）
// ============================================================

/** @deprecated 旧版物料项类型，保留兼容 */
export interface InboundOrderItem {
  material: string
  ean?: string
  brand: string
  category?: string
  color?: string
  size?: string
  season?: string
  description?: string
  quantity: number
  price?: number
}

/** @deprecated 旧版入库单数据类型，保留兼容 */
export interface InboundOrderData {
  orderNo?: string
  inboundTime?: string
  materials: InboundOrderItem[]
  totalQuantity?: number
  remark?: string
}

/** @deprecated 旧版导入接口，保留兼容 */
export function importInboundOrder(data: InboundOrderItem[]) {
  return request({
    url: '/inbound/import',
    method: 'post',
    data
  })
}

// ============================================================
// 批量入库（对应后端 POST /inventory/insertBatch）
// 后端在 inventory 表按 (position, material) 做 ON DUPLICATE KEY 累加
// ============================================================

/**
 * 批量入库：将库存写入指定库位。
 *
 * 后端契约：`POST /inventory/insertBatch`，请求体为 `Inventory[]`，
 * 其中 `position`、`material`、`quantity` 为必填，`ean` 可选。
 */
export function insertBatch(data: InventoryItem[]): Promise<ApiResult<string>> {
  return request({
    url: '/inventory/insertBatch',
    method: 'post',
    data
  }) as Promise<ApiResult<string>>
}

/**
 * 上架（兼容旧调用方 PutAway.vue）：将单个物料写入指定库位。
 *
 * 后端并未提供 /position/putAway，实际等价于批量入库单条记录，
 * 这里统一收敛到 POST /inventory/insertBatch，保持契约一致。
 */
export function putAway(data: {
  position: string
  material: string
  quantity: number
  ean?: string
}): Promise<ApiResult<string>> {
  const items: InventoryItem[] = [
    {
      position: data.position,
      material: data.material,
      quantity: data.quantity,
      ean: data.ean || ''
    }
  ]
  return insertBatch(items)
}
