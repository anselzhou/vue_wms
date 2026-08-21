import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

// 按需注册：仅注册用到的图表与组件，控制打包体积
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  CanvasRenderer
])

/**
 * ECharts 封装：初始化 / 更新 / 自适应 resize / 销毁
 *
 * @param chartRef 图表挂载的 DOM 容器 ref
 * @returns init(option) 初始化或更新图表
 *
 * 用法：
 *   const chartEl = ref<HTMLDivElement>()
 *   const chart = useECharts(chartEl)
 *   chart.init({ xAxis: {...}, series: [...] })
 */
export function useECharts(chartRef: Ref<HTMLDivElement | null>) {
  let chart: echarts.ECharts | null = null
  let observer: ResizeObserver | null = null

  const init = (option: EChartsCoreOption) => {
    if (!chartRef.value) return
    if (!chart) {
      chart = echarts.init(chartRef.value)
      // 容器尺寸变化时自适应
      observer = new ResizeObserver(() => chart?.resize())
      observer.observe(chartRef.value)
    }
    chart.setOption(option, true)
  }

  const resize = () => {
    chart?.resize()
  }

  const dispose = () => {
    observer?.disconnect()
    observer = null
    chart?.dispose()
    chart = null
  }

  onMounted(() => {
    // 初始渲染后确保图表已挂载容器
    if (chartRef.value && !chart) {
      init({})
    }
  })

  onBeforeUnmount(dispose)

  return { init, resize, dispose }
}
