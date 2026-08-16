import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

/** 物料信息（对应后端 com.example.wms.entity.Material） */
export interface Material {
  brand?: string
  /** 物料编码 */
  material: string
  /** EAN 码 */
  ean?: string
  category?: string
  description?: string
  season?: string
  color?: string
  size?: string
  price?: number
  createTime?: string
  updateTime?: string
}

/**
 * 查询物料信息（对应 GET /material/info）
 *
 * 后端契约：`material` 为空时返回全部物料，否则精确查询；
 * 无论哪种情况，`data` 都是 `Material[]`（单个结果也会包装为数组）。
 */
export function getMaterialInfo(material?: string): Promise<ApiResult<Material[]>> {
  return request({
    url: '/material/info',
    method: 'get',
    // 关键字为空时不携带 material 参数，后端返回全部物料信息
    params: material ? { material } : {},
    // 查询物料信息失败时由调用方决定提示文案，跳过拦截器的全局错误弹窗
    skipErrorMessage: true
  } as any) as Promise<ApiResult<Material[]>>
}

/** POST /material/import — 导入物料信息（重复数据自动忽略） */
export function importMaterials(data: Material[]) {
  return request({
    url: '/material/import',
    method: 'post',
    data
  })
}
