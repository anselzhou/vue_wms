<template>
  <div class="inbound-container">
    <el-card class="inbound-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">入库管理</h2>
          <el-tag type="success" size="large">
            当前物料数：{{ materialList.length }}
          </el-tag>
        </div>
      </template>

      <!-- 输入区域 -->
      <div class="input-section">
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="物料编码">
            <el-input
              v-model="materialCode"
              placeholder="请输入物料编码，按回车添加"
              size="large"
              clearable
              :prefix-icon="Search"
              @keyup.enter="handleAddMaterial"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :icon="Plus"
              @click="handleAddMaterial"
            >
              添加物料
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 物料列表表格 -->
      <div class="table-section">
        <el-table
          :data="materialList"
          stripe
          style="width: 100%"
          empty-text="暂无物料数据"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column type="index" label="序号" width="80" align="center" />

          <el-table-column prop="materialCode" label="物料编码" min-width="150">
            <template #default="{ row }">
              <el-tag type="info">{{ row.materialCode }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="materialName" label="物料名称" min-width="180" />

          <el-table-column prop="specification" label="规格型号" min-width="150" />

          <el-table-column prop="unit" label="单位" width="100" align="center" />

          <el-table-column prop="quantity" label="数量" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="success" effect="plain">{{ row.quantity }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row, $index }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-section">
        <el-button
          type="warning"
          size="large"
          :icon="Refresh"
          @click="handleClear"
          :disabled="materialList.length === 0"
        >
          清空列表
        </el-button>

        <el-button
          type="success"
          size="large"
          :icon="Check"
          @click="handleSubmit"
          :disabled="materialList.length === 0"
          :loading="isSubmitting"
        >
          {{ isSubmitting ? '提交中...' : '提交入库' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Refresh, Check } from '@element-plus/icons-vue'

interface Material {
  materialCode: string
  materialName: string
  specification: string
  unit: string
  quantity: number
}

const materialCode = ref('')
const materialList = ref<Material[]>([])
const isSubmitting = ref(false)

// 模拟物料数据库
const mockMaterialDatabase: Record<string, Omit<Material, 'materialCode' | 'quantity'>> = {
  'MAT001': {
    materialName: '螺丝钉 M6',
    specification: 'M6×20mm',
    unit: '个'
  },
  'MAT002': {
    materialName: '螺母 M6',
    specification: 'M6',
    unit: '个'
  },
  'MAT003': {
    materialName: '垫片',
    specification: 'Φ6×1.5mm',
    unit: '片'
  },
  'MAT004': {
    materialName: '轴承',
    specification: '6204-2RS',
    unit: '套'
  },
  'MAT005': {
    materialName: '密封圈',
    specification: 'O型 Φ50×3mm',
    unit: '个'
  }
}

// 添加物料
const handleAddMaterial = () => {
  const code = materialCode.value.trim()

  if (!code) {
    ElMessage.warning('请输入物料编码')
    return
  }

  // 检查是否已存在
  const existsIndex = materialList.value.findIndex(item => item.materialCode === code)
  if (existsIndex !== -1) {
    ElMessage.warning(`物料 ${code} 已存在，数量 +1`)
    materialList.value[existsIndex].quantity += 1
    materialCode.value = ''
    return
  }

  // 从模拟数据库中获取物料信息
  const mockData = mockMaterialDatabase[code]

  if (mockData) {
    // 找到模拟数据
    materialList.value.push({
      materialCode: code,
      ...mockData,
      quantity: 1
    })
    ElMessage.success(`添加成功：${mockData.materialName}`)
  } else {
    // 未找到模拟数据，使用默认信息
    materialList.value.push({
      materialCode: code,
      materialName: `物料 ${code}`,
      specification: '标准规格',
      unit: '个',
      quantity: 1
    })
    ElMessage.success(`添加成功：未知物料 ${code}`)
  }

  // 清空输入框
  materialCode.value = ''
}

// 删除物料
const handleDelete = (index: number) => {
  const material = materialList.value[index]

  ElMessageBox.confirm(
    `确定要删除物料 "${material.materialCode}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    materialList.value.splice(index, 1)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消
  })
}

// 清空列表
const handleClear = () => {
  ElMessageBox.confirm(
    '确定要清空所有物料吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    materialList.value = []
    ElMessage.success('已清空列表')
  }).catch(() => {
    // 用户取消
  })
}

// 提交入库
const handleSubmit = async () => {
  if (materialList.value.length === 0) {
    ElMessage.warning('请先添加物料')
    return
  }

  try {
    isSubmitting.value = true

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟提交的数据
    const submitData = {
      inboundTime: new Date().toISOString(),
      materials: materialList.value,
      totalQuantity: materialList.value.reduce((sum, item) => sum + item.quantity, 0)
    }

    console.log('提交的入库数据:', submitData)

    // 显示成功消息
    ElMessage.success({
      message: `入库成功！共 ${materialList.value.length} 种物料，总计 ${submitData.totalQuantity} 件`,
      duration: 3000
    })

    // 清空列表
    materialList.value = []
    materialCode.value = ''

  } catch (error) {
    ElMessage.error('入库失败，请稍后重试')
    console.error('入库错误:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.inbound-container {
  padding: 20px;
}

.inbound-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d1b20;
}

.input-section {
  padding: 20px 0;
  border-bottom: 1px solid #e6e0e9;
}

.table-section {
  margin: 20px 0;
  min-height: 300px;
}

.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e6e0e9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .inbound-container {
    padding: 12px;
  }

  .action-section {
    flex-direction: column;
  }

  .action-section .el-button {
    width: 100%;
  }
}
</style>
