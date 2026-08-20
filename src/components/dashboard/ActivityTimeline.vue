<template>
  <el-card shadow="never" class="activity-card">
    <template #header>
      <div class="activity-header">
        <span class="activity-title">最新动态</span>
        <router-link to="/system/log" class="activity-more">查看全部</router-link>
      </div>
    </template>

    <el-empty v-if="activities.length === 0" description="暂无操作记录" :image-size="72" />

    <el-timeline v-else class="activity-timeline">
      <el-timeline-item
        v-for="item in activities"
        :key="item.id"
        :timestamp="formatTime(item.createTime)"
        :type="item.status === 1 ? 'success' : 'danger'"
        placement="top"
      >
        <div class="activity-item">
          <div class="activity-item-content">
            <span class="activity-operator">{{ item.username || '系统' }}</span>
            <span class="activity-op">{{ item.operation || '执行了操作' }}</span>
          </div>
          <el-tag
            :type="item.status === 1 ? 'success' : 'danger'"
            size="small"
            effect="plain"
            round
          >
            {{ item.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </div>
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import type { DashboardActivity } from '@/api/dashboard'

defineProps<{
  activities: DashboardActivity[]
}>()

const formatTime = (time?: string) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 19)
}
</script>

<style scoped>
.activity-card {
  border-radius: var(--wms-radius);
  border: 1px solid var(--wms-border);
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--wms-text);
}

.activity-more {
  font-size: 12px;
  color: var(--wms-primary);
  text-decoration: none;
}

.activity-more:hover {
  text-decoration: underline;
}

.activity-timeline {
  padding: 4px 4px 4px 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.activity-operator {
  font-weight: 600;
  color: var(--wms-text);
  white-space: nowrap;
}

.activity-op {
  color: var(--wms-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
