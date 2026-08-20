import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

// ============================================================
// Dashboard 仪表盘（对应后端 com.example.wms.controller.DashboardController）
// ============================================================

/** 汇总指标 */
export interface DashboardSummary {
  /** 今日入库数 */
  todayInbound: number
  /** 今日出库数 */
  todayOutbound: number
  /** 当前总库存 */
  totalInventory: number
  /** 物料种类数 */
  materialCount: number
  /** 今日订单数 */
  todayOrders: number
  /** 库位总数 */
  totalPositions: number
}

/** 每日趋势点 */
export interface TrendPoint {
  /** 日期 yyyy-MM-dd */
  date: string
  /** 当日入库量 */
  inbound: number
  /** 当日出库量 */
  outbound: number
  /** 当日末总库存 */
  inventory: number
}

/** 品类分布 */
export interface CategoryCount {
  name: string
  value: number
}

/** 业务统计响应 */
export interface DashboardStats {
  summary: DashboardSummary
  trend: TrendPoint[]
  categories: CategoryCount[]
}

/** 系统监控指标 */
export interface MonitorMetric {
  /** cpu / memory / disk / traffic */
  key: string
  /** 中文名称 */
  label: string
  /** 当前值 */
  value: number
  /** 单位：% / MB / GB / 次 */
  unit: string
  /** 较昨日变化百分比 */
  trend: number
  /** normal / warning / danger */
  status: string
  /** 近 N 天迷你走势 */
  series: number[]
}

/** 系统监控响应 */
export interface SystemMonitorInfo {
  metrics: MonitorMetric[]
}

/** 最新动态项 */
export interface DashboardActivity {
  id: number
  username?: string
  operation?: string
  status?: number
  createTime?: string
}

/**
 * 获取业务统计
 * GET /dashboard/stats?days=7|30
 */
export function getDashboardStats(days = 7): Promise<ApiResult<DashboardStats>> {
  return request({
    url: '/dashboard/stats',
    method: 'get',
    params: { days }
  }) as Promise<ApiResult<DashboardStats>>
}

/**
 * 获取系统监控信息
 * GET /dashboard/system?days=7
 */
export function getSystemMonitor(days = 7): Promise<ApiResult<SystemMonitorInfo>> {
  return request({
    url: '/dashboard/system',
    method: 'get',
    params: { days }
  }) as Promise<ApiResult<SystemMonitorInfo>>
}

/**
 * 获取最新动态
 * GET /dashboard/activities?limit=10
 */
export function getDashboardActivities(limit = 10): Promise<ApiResult<DashboardActivity[]>> {
  return request({
    url: '/dashboard/activities',
    method: 'get',
    params: { limit }
  }) as Promise<ApiResult<DashboardActivity[]>>
}
