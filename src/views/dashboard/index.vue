<template>
  <div class="dashboard-page" v-loading="isLoading">
    <!-- ① 欢迎区域 -->
    <section class="welcome-card">
      <div class="welcome-info">
        <div class="welcome-greeting">
          <h2 class="welcome-title">{{ greeting }}，{{ displayName }}</h2>
          <p class="welcome-desc">欢迎回到 WMS 仓库管理系统，祝您工作顺利！</p>
        </div>
        <div class="welcome-meta">
          <span class="welcome-date">{{ nowDate }}</span>
          <span class="welcome-time">{{ nowTime }}</span>
        </div>
      </div>

      <div class="welcome-actions">
        <el-badge :value="activities.length" :max="99" class="welcome-badge">
          <el-button circle class="welcome-action-btn">
            <el-icon :size="18"><Bell /></el-icon>
          </el-button>
        </el-badge>
        <el-avatar :size="44" class="welcome-avatar">{{ avatarText }}</el-avatar>
      </div>
    </section>

    <!-- ② 系统信息概览 -->
    <section class="section-title-row">
      <h3 class="section-title">系统状态</h3>
      <span class="section-sub">实时监控中</span>
    </section>
    <section class="system-grid">
      <SystemStatCard v-for="m in metrics" :key="m.key" :metric="m" />
    </section>

    <!-- ③ 近期数据统计 -->
    <section class="section-title-row">
      <h3 class="section-title">近期数据统计</h3>
      <el-radio-group v-model="range" size="small" @change="handleRangeChange">
        <el-radio-button :value="7">近7天</el-radio-button>
        <el-radio-button :value="30">近30天</el-radio-button>
      </el-radio-group>
    </section>
    <section class="chart-grid">
      <el-card shadow="never" class="chart-card trend-card">
        <template #header>
          <span class="chart-title">出入库与库存趋势</span>
        </template>
        <div ref="trendEl" class="chart-container" />
      </el-card>
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">品类库存分布</span>
        </template>
        <div ref="categoryEl" class="chart-container" />
      </el-card>
    </section>

    <!-- ④ 最新动态 -->
    <section class="section-title-row">
      <h3 class="section-title">最新动态</h3>
    </section>
    <ActivityTimeline :activities="activities" />

    <!-- ⑤ 业务摘要 -->
    <section class="summary-grid" v-if="stats">
      <div class="summary-item">
        <span class="summary-label">今日入库</span>
        <span class="summary-value">{{ stats.summary.todayInbound }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">今日出库</span>
        <span class="summary-value">{{ stats.summary.todayOutbound }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">当前总库存</span>
        <span class="summary-value">{{ stats.summary.totalInventory }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">物料种类</span>
        <span class="summary-value">{{ stats.summary.materialCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">今日订单</span>
        <span class="summary-value">{{ stats.summary.todayOrders }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">库位总数</span>
        <span class="summary-value">{{ stats.summary.totalPositions }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import {
  getDashboardStats,
  getDashboardActivities,
  getSystemMonitor,
  type DashboardStats,
  type MonitorMetric,
  type DashboardActivity
} from '@/api/dashboard'
import { getUserInfo } from '@/utils/setUserInfo'
import { useECharts } from '@/composables/useECharts'
import SystemStatCard from '@/components/dashboard/SystemStatCard.vue'
import ActivityTimeline from '@/components/dashboard/ActivityTimeline.vue'

// ==================== 状态 ====================

const isLoading = ref(true)
const stats = ref<DashboardStats | null>(null)
const metrics = ref<MonitorMetric[]>([])
const activities = ref<DashboardActivity[]>([])
const range = ref(7)

// ==================== 欢迎区域 ====================

const userInfo = getUserInfo()
const displayName = computed(() => userInfo?.nickname || userInfo?.username || '用户')

const avatarText = computed(() => {
  const name = displayName.value
  return name.slice(0, 1).toUpperCase()
})

const nowDate = ref('')
const nowTime = ref('')
let clockTimer: number | null = null

const getGreeting = (hour: number) => {
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const greeting = ref('')

const updateClock = () => {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六']
  nowDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${week[now.getDay()]}`
  nowTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  greeting.value = getGreeting(now.getHours())
}

// ==================== 图表 ====================

const trendEl = ref<HTMLDivElement | null>(null)
const categoryEl = ref<HTMLDivElement | null>(null)
const trendChart = useECharts(trendEl)
const categoryChart = useECharts(categoryEl)

/** 读取 CSS 变量主色 */
const getCssVar = (name: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#1677ff'
}

const renderTrendChart = () => {
  if (!stats.value) return
  const trend = stats.value.trend
  const dates = trend.map((t) => t.date.slice(5))
  const showLabel = trend.length <= 7

  trendChart.init({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['入库量', '出库量', '总库存'],
      bottom: 0,
      icon: 'roundRect'
    },
    grid: { left: 8, right: 16, top: 16, bottom: 32, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: getCssVar('--wms-text-muted'), fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: getCssVar('--wms-text-muted'), fontSize: 11 }
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: trend.map((t) => t.inbound),
        itemStyle: { color: getCssVar('--wms-primary') },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: getCssVar('--wms-primary-soft') },
              { offset: 1, color: 'rgba(255,255,255,0)' }
            ]
          }
        },
        label: showLabel ? { show: true, position: 'top', fontSize: 10, color: getCssVar('--wms-text-muted') } : { show: false }
      },
      {
        name: '出库量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: trend.map((t) => t.outbound),
        itemStyle: { color: '#e6a23c' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(230, 162, 60, 0.35)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0)' }
            ]
          }
        },
        label: showLabel ? { show: true, position: 'top', fontSize: 10, color: getCssVar('--wms-text-muted') } : { show: false }
      },
      {
        name: '总库存',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: trend.map((t) => t.inventory),
        itemStyle: { color: '#9b59b6' },
        lineStyle: { type: 'dashed', width: 2 }
      }
    ]
  })
}

const renderCategoryChart = () => {
  if (!stats.value) return
  const categories = stats.value.categories
  const palette = [
    getCssVar('--wms-primary'),
    '#e6a23c',
    '#67c23a',
    '#f56c6c',
    '#9b59b6',
    '#409eff',
    '#00b2a9',
    '#f39c12'
  ]
  const data = categories.map((c, i) => ({
    name: c.name,
    value: c.value,
    itemStyle: { color: palette[i % palette.length] }
  }))

  categoryChart.init({
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 件 ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: getCssVar('--wms-text-secondary'), fontSize: 11 }
    },
    series: [
      {
        name: '品类库存',
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 600 }
        },
        data
      }
    ]
  })
}

// ==================== 数据加载 ====================

const fetchData = async () => {
  isLoading.value = true
  try {
    const [statsRes, monitorRes, activitiesRes] = await Promise.all([
      getDashboardStats(range.value),
      getSystemMonitor(7),
      getDashboardActivities(10)
    ])
    stats.value = statsRes.data
    metrics.value = monitorRes.data.metrics
    activities.value = activitiesRes.data
    renderTrendChart()
    renderCategoryChart()
  } catch (e: any) {
    console.error('Dashboard 数据加载失败:', e)
  } finally {
    isLoading.value = false
  }
}

const handleRangeChange = () => {
  fetchData()
}

// ==================== 生命周期 ====================

onMounted(() => {
  updateClock()
  clockTimer = window.setInterval(updateClock, 1000)
  fetchData()
})

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer)
  }
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== 欢迎区域 ===== */
.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: linear-gradient(135deg, var(--wms-primary), var(--wms-primary-soft));
  border-radius: var(--wms-radius-lg);
  padding: 28px 32px;
  color: var(--wms-on-primary);
  box-shadow: var(--wms-shadow-card);
}

.welcome-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.welcome-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--wms-on-primary);
}

.welcome-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}

.welcome-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  opacity: 0.9;
  font-variant-numeric: tabular-nums;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.welcome-badge {
  flex-shrink: 0;
}

.welcome-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: var(--wms-on-primary);
}

.welcome-action-btn:hover {
  background: rgba(255, 255, 255, 0.32) !important;
  color: var(--wms-on-primary) !important;
}

.welcome-avatar {
  background: rgba(255, 255, 255, 0.25);
  color: var(--wms-on-primary);
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

/* ===== 区块标题 ===== */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--wms-text);
}

.section-sub {
  font-size: 12px;
  color: var(--wms-text-muted);
}

/* ===== 系统指标卡片 ===== */
.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

/* ===== 图表 ===== */
.chart-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
}

.chart-card {
  border-radius: var(--wms-radius);
  border: 1px solid var(--wms-border);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--wms-text);
}

.chart-container {
  height: 320px;
  width: 100%;
}

/* ===== 业务摘要 ===== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.summary-item {
  background: var(--wms-surface);
  border: 1px solid var(--wms-border);
  border-radius: var(--wms-radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: var(--wms-shadow-sm);
}

.summary-label {
  font-size: 12px;
  color: var(--wms-text-muted);
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--wms-text);
  font-variant-numeric: tabular-nums;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .welcome-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .welcome-title {
    font-size: 21px;
  }

  .system-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .chart-container {
    height: 280px;
  }
}
</style>
