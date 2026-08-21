import request from '@/utils/request'

/** 物料拣货请求（对应后端 MaterialRequest） */
export interface MaterialRequest {
  /** EAN码（后端按 ean 查库存） */
  ean: string
  /** 需求数量 */
  quantity: number
}

/** 创建拣货单请求体（对应 POST /inventory/pickingList 的 PickingListRequest） */
export interface PickingListRequest {
  materialRequests: MaterialRequest[]
  operatorId?: number
  remark?: string
}

/** 拣货单明细项（对应后端 PickingOrderItem） */
export interface PickingOrderItem {
  id?: number
  orderId?: number
  /** 库位 */
  position: string
  ean: string
  material: string
  /** 应拣数量 */
  requiredQuantity: number
  /** 已拣数量 */
  pickedQuantity: number
  /** PENDING / COMPLETED */
  status: string
  createTime?: string
  updateTime?: string
}

/** 拣货单（对应后端 PickingOrder） */
export interface PickingOrder {
  id: number
  orderNo: string
  operatorId?: number
  /** PENDING / COMPLETED */
  status: string
  totalQuantity: number
  remark?: string
  createTime?: string
  updateTime?: string
  items?: PickingOrderItem[]
}

/** POST /inventory/pickingList — 创建拣货单（按库存自动分配库位） */
export function createPickingOrder(data: PickingListRequest) {
  return request({
    url: '/inventory/pickingList',
    method: 'post',
    data
  })
}

/** GET /inventory/pickingOrders — 获取所有拣货单 */
export function getPickingOrderList() {
  return request({
    url: '/inventory/pickingOrders',
    method: 'get'
  })
}

/** GET /inventory/pickingOrders/status/{status} — 按状态获取拣货单 */
export function getPickingOrdersByStatus(status: string) {
  return request({
    url: `/inventory/pickingOrders/status/${status}`,
    method: 'get'
  })
}

/** GET /inventory/pickingOrder/{orderNo} — 按订单号获取拣货单（含明细） */
export function getPickingOrderByNo(orderNo: string) {
  return request({
    url: `/inventory/pickingOrder/${orderNo}`,
    method: 'get'
  })
}

/** GET /inventory/pickingOrder/items/{orderId} — 获取拣货单明细 */
export function getPickingOrderItems(orderId: number) {
  return request({
    url: `/inventory/pickingOrder/items/${orderId}`,
    method: 'get'
  })
}

/** PUT /inventory/pickingOrder/complete/{id} — 完成拣货单 */
export function completePickingOrder(id: number) {
  return request({
    url: `/inventory/pickingOrder/complete/${id}`,
    method: 'put'
  })
}

/** PUT /inventory/pickingOrder/status/{id} — 更新拣货单状态 */
export function updatePickingOrderStatus(id: number, status: string) {
  return request({
    url: `/inventory/pickingOrder/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// ============================================================
// 出库模块
// ============================================================

/** 出库记录（对应后端 OutboundRecord） */
export interface OutboundRecord {
  id?: number
  /** 出库单号 */
  orderNo: string
  /** 库位 */
  position: string
  /** EAN码 */
  ean?: string
  /** 物料编码 */
  material: string
  /** 出库数量 */
  quantity: number
  /** 操作员ID */
  operatorId?: number
  /** 操作员名称 */
  operatorName?: string
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime?: string
}

/** 出库请求体（对应后端 OutboundRequest） */
export interface OutboundRequest {
  /** 库位 */
  position: string
  /** 物料编码 */
  material: string
  /** 出库数量 */
  quantity: number
  /** 备注 */
  remark?: string
}

/** POST /outbound/submit — 提交出库（扣减库存并写入记录） */
export function submitOutbound(data: OutboundRequest) {
  return request({
    url: '/outbound/submit',
    method: 'post',
    data
  })
}

/** GET /outbound/list — 查询出库记录（按时间倒序） */
export function getOutboundList() {
  return request({
    url: '/outbound/list',
    method: 'get'
  })
}