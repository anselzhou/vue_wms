<template>
  <div class="stat-card" :class="`status-${metric.status}`">
    <div class="stat-card-header">
      <div class="stat-icon">
        <el-icon :size="20">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <span class="stat-label">{{ metric.label }}</span>
      <el-tag v-if="metric.status === 'danger'" type="danger" size="small" effect="light" round>
        异常
      </el-tag>
      <el-tag v-else-if="metric.status === 'warning'" type="warning" size="small" effect="light" round>
        偏高
      </el-tag>
    </div>

    <div class="stat-body">
      <div class="stat-value-row">
        <span class="stat-value">{{ formatValue(metric.value) }}</span>
        <span class="stat-unit">{{ metric.unit }}</span>
        <span class="stat-trend" :class="trendClass">
          <el-icon :size="12">
            <CaretTop v-if="metric.trend >= 0" />
            <CaretBottom v-else />
          </el-icon>
          {{ Math.abs(metric.trend) }}%
        </span>
      </div>

      <div ref="sparkEl" class="stat-spark" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Cpu,
  Odometer,
  Coin,
  Connection,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import { useECharts } from '@/composables/useECharts'
import type { MonitorMetric } from '@/api/dashboard'

const props = defineProps<{
  metric: MonitorMetric
}>()

const sparkEl = ref<HTMLDivElement | null>(null)
const { init: initSpark } = useECharts(sparkEl)

const iconComponent = computed(() => {
  switch (props.metric.key) {
    case 'cpu':
      return Cpu
    case 'memory':
      return Odometer
    case 'disk':
      return Coin
    case 'traffic':
      return Connection
    default:
      return Odometer
  }
})

const trendClass = computed(() =>
  props.metric.trend >= 0 ? 'trend-up' : 'trend-down'
)

const formatValue = (v: number) => {
  if (props.metric.key === 'memory') {
    // 内存已用值很大时转为 GB 展示
    return v >= 1024 ? (v / 1024).toFixed(1) : String(Math.round(v))
  }
  return String(Math.round(v))
}

const renderSpark = () => {
  const series = props.metric.series ?? []
  const isDanger = props.metric.status === 'danger'
  const isWarning = props.metric.status === 'warning'
  const color = isDanger
    ? '#f56c6c'
    : isWarning
      ? '#e6a23c'
      : 'var(--wms-primary)'

  initSpark({
    grid: { left: 2, right: 2, top: 4, bottom: 2 },
    xAxis: { type: 'category', show: false, data: series.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 0 },
    series: [
      {
        type: 'line',
        data: series,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: isDanger || isWarning ? color : 'var(--wms-primary-soft)' },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' }
            ]
          }
        }
      }
    ]
  })
}

onMounted(() => {
  renderSpark()
})

watch(
  () => props.metric,
  () => renderSpark(),
  { deep: true }
)
</script>

<style scoped>
.stat-card {
  position: relative;
  background: var(--wms-surface);
  border-radius: var(--wms-radius);
  box-shadow: var(--wms-shadow-sm);
  padding: 18px 20px;
  border: 1px solid var(--wms-border);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  overflow: hidden;
}

.stat-card:hover {
  box-shadow: var(--wms-shadow-card);
  transform: translateY(-2px);
}

/* 异常 / 偏高状态左侧警示条 */
.stat-card.status-danger::before,
.stat-card.status-warning::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.stat-card.status-danger::before {
  background: #f56c6c;
}

.stat-card.status-warning::before {
  background: #e6a23c;
}

.stat-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wms-primary-bg);
  color: var(--wms-primary);
  flex-shrink: 0;
}

.stat-card.status-danger .stat-icon {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-card.status-warning .stat-icon {
  background: #fdf6ec;
  color: #e6a23c;
}

.stat-label {
  font-size: 13px;
  color: var(--wms-text-secondary);
  flex: 1;
}

.stat-body {
  margin-top: 14px;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--wms-text);
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 12px;
  color: var(--wms-text-muted);
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.stat-card.status-danger .stat-trend,
.stat-card.status-warning .stat-trend {
  color: var(--wms-text-muted);
}

.stat-spark {
  height: 40px;
  margin-top: 10px;
}
</style>
