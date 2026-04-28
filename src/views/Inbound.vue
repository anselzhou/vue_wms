<template>
  <div class="min-h-screen bg-zinc-950 p-8">
    <div class="max-w-6xl mx-auto">
      <!-- 标题 -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <Scan class="w-9 h-9 text-emerald-500" />
            入库扫描
          </h1>
          <p class="text-zinc-400 mt-1">扫描或输入物料条码 → 自动入库</p>
        </div>
        <button @click="clearTable"
          class="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-2xl text-zinc-400 transition-colors">
          <Trash2 class="w-5 h-5" />
          清空列表
        </button>
      </div>

      <!-- 输入框 -->
      <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
        <div class="relative">
          <div class="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500">
            <Barcode class="w-7 h-7" />
          </div>
          <input v-model="barcodeInput" @keyup.enter="handleScan" ref="barcodeRef" type="text"
            placeholder="请扫描或输入物料条码..."
            class="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-3xl py-6 pl-16 pr-8 text-2xl text-white placeholder-zinc-500 outline-none transition-all"
            autofocus />
        </div>
        <p class="text-center text-zinc-500 text-sm mt-4">按 Enter 键确认</p>
      </div>

      <!-- 数据表格 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div class="px-8 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div class="font-semibold text-white flex items-center gap-3">
            已扫描入库
            <span class="text-emerald-400 text-lg">{{ tableData.length }}</span>
          </div>
          <div class="text-sm text-zinc-400">共 {{ tableData.length }} 条记录</div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-zinc-950 sticky top-0">
              <tr class="text-zinc-400 text-sm">
                <th class="px-8 py-5 text-left">序号</th>
                <th class="px-8 py-5 text-left">物料编码</th>
                <th class="px-8 py-5 text-left">物料名称</th>
                <th class="px-8 py-5 text-left">规格型号</th>
                <th class="px-8 py-5 text-left">单位</th>
                <th class="px-8 py-5 text-right">数量</th>
                <th class="px-8 py-5 text-left">扫描时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800 text-white">
              <tr v-for="(item, index) in tableData" :key="index" class="hover:bg-zinc-800/50">
                <td class="px-8 py-5">{{ index + 1 }}</td>
                <td class="px-8 py-5 font-mono">{{ item.materialCode }}</td>
                <td class="px-8 py-5">{{ item.materialName }}</td>
                <td class="px-8 py-5 text-zinc-400">{{ item.spec || '-' }}</td>
                <td class="px-8 py-5">{{ item.unit || '-' }}</td>
                <td class="px-8 py-5 text-right font-medium">{{ item.quantity || 1 }}</td>
                <td class="px-8 py-5 text-zinc-400 text-sm">{{ item.scanTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-if="tableData.length === 0" class="h-80 flex flex-col items-center justify-center text-zinc-500">
          <Scan class="w-20 h-20 mb-6 opacity-30" />
          <p class="text-xl">暂无扫描记录</p>
          <p class="text-sm mt-2">请在上方输入框扫描物料条码</p>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toast.show" :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white shadow-2xl flex items-center gap-3 z-50 transition-all duration-300">
      <CheckCircle v-if="toast.type === 'success'" class="w-6 h-6" />
      <AlertCircle v-else class="w-6 h-6" />
      <span class="text-lg">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { Scan, Barcode, CheckCircle, AlertCircle, Trash2 } from 'lucide-vue-next'

const barcodeInput = ref('')
const barcodeRef = ref(null)
const tableData = ref([])

const toast = ref({
  show: false,
  message: '',
  type: 'success' // success / error
})

// 音频
const successAudio = new Audio('/sounds/correct.mp3')
const errorAudio = new Audio('/sounds/error.mp3')

// 模拟后端返回数据结构（请根据你实际接口调整）
const handleScan = async () => {
  const code = barcodeInput.value.trim()
  if (!code) return

  try {
    const res = await fetch('/getMaterialInfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialCode: code })
    })

    const result = await res.json()

    if (result.code === 200 && result.data) {
      // 成功
      const item = {
        materialCode: result.data.materialCode || code,
        materialName: result.data.materialName,
        spec: result.data.spec,
        unit: result.data.unit,
        quantity: result.data.quantity || 1,
        scanTime: new Date().toLocaleString('zh-CN')
      }

      tableData.value.unshift(item) // 新数据插入最上方

      successAudio.currentTime = 0
      successAudio.play().catch(() => { })

      showToast('入库成功！', 'success')
    } else {
      // 未找到
      errorAudio.currentTime = 0
      errorAudio.play().catch(() => { })
      showToast('未查询到产品信息，请检查条码是否正确！', 'error')
    }
  } catch (err) {
    console.error(err)
    errorAudio.play().catch(() => { })
    showToast('请求失败，请检查网络或接口', 'error')
  }

  // 清空输入框并重新聚焦（方便连续扫描）
  barcodeInput.value = ''
  nextTick(() => {
    barcodeRef.value?.focus()
  })
}

// Toast 提示
const showToast = (msg, type) => {
  toast.value = { show: true, message: msg, type }
  setTimeout(() => {
    toast.value.show = false
  }, 2800)
}

// 清空表格
const clearTable = () => {
  if (confirm('确定要清空所有入库记录吗？')) {
    tableData.value = []
  }
}

// 页面加载后自动聚焦输入框
onMounted(() => {
  nextTick(() => barcodeRef.value?.focus())
})
</script>
