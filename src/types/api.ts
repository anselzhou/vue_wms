/**
 * 后端统一响应结构（对应后端 com.example.wms.entity.Result<T>）
 *
 * 注意：`@/utils/request` 的响应拦截器在 `code === 200` 时会直接
 * 返回 `Result<T>` 本身，因此 API 层函数实际 resolve 的是该结构，
 * 而非 AxiosResponse。所有 API 函数统一使用 `Promise<ApiResult<T>>`。
 */
export interface ApiResult<T> {
  /** 业务状态码，200 表示成功 */
  code: number
  /** 提示信息 */
  message: string
  /** 响应数据 */
  data: T
}
