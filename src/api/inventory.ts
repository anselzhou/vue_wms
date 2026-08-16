import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

// ============================================================
// 移库（对应后端 com.example.wms.entity.RelocationRequest）
// ============================================================

export interface RelocationRequest {
  /** 原库位 */
  fromPosition: string
  /** 目标库位 */
  toPosition: string
  /** 物料编码 */
  material: string
  /** 移库数量 */
  quantity: number
}

// ============================================================
// 物料位置信息（对应后端 com.example.wms.entity.MaterialPositionInfo）
// ============================================================

export interface MaterialPositionInfo {
  position: string
  ean: string
  material: string
  color: string
  size: string
  description: string
  brand: string
  quantity: number
  blockQuantity: number
  availableQuantity: number
}

// ============================================================
// 库存查询相关（部分接口的响应与后端路径需对齐）
// ============================================================

/** 按物料编码精确查询库存位置（后端路径：/inventory/queryByMaterial，返回数组） */
export function queryByMaterial(material: string): Promise<ApiResult<MaterialPositionInfo[]>> {
  return request({
    url: '/inventory/queryByMaterial',
    method: 'get',
    params: { material }
  }) as Promise<ApiResult<MaterialPositionInfo[]>>
}

/** 按物料编码查询该物料在各库位的库存（后端实际路径为 /material/queryByMaterial） */
export function queryMaterialStock(material: string): Promise<ApiResult<MaterialPositionInfo[]>> {
  return request({
    url: '/material/queryByMaterial',
    method: 'get',
    params: { material }
  }) as Promise<ApiResult<MaterialPositionInfo[]>>
}

/** 物料移库：POST /inventory/relocation */
export function relocate(data: RelocationRequest): Promise<ApiResult<string>> {
  return request({
    url: '/inventory/relocation',
    method: 'post',
    data
  }) as Promise<ApiResult<string>>
}

/** 库位重置：将原库位所有物料搬到目标库位 */
export function locationReset(fromPosition: string, toPosition: string): Promise<ApiResult<string>> {
  return request({
    url: '/inventory/locationReset',
    method: 'post',
    params: { fromPosition, toPosition }
  }) as Promise<ApiResult<string>>
}

/** 按款式编码模糊查询库存位置 */
export function queryByTypeCode(typeCode: string): Promise<ApiResult<MaterialPositionInfo[]>> {
  return request({
    url: '/inventory/queryByTypeCode',
    method: 'get',
    params: { typeCode }
  }) as Promise<ApiResult<MaterialPositionInfo[]>>
}
