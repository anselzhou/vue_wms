<template>
  <el-button
      class="toggle-lock-btn"
      :class="{ active: modelValue }"
      :size="size"
      @click="handleClick"
  >
    <el-icon class="icon">
      <Lock v-if="!modelValue" />
      <Unlock v-else />
    </el-icon>
    <span>{{ modelValue ? activeText : inactiveText }}</span>
  </el-button>
</template>

<script setup>
import { Lock, Unlock } from '@element-plus/icons-vue'

const props = defineProps({
  // 支持 v-model
  modelValue: {
    type: Boolean,
    default: false
  },
  // 未激活时的文字
  inactiveText: {
    type: String,
    default: '锁定'
  },
  // 激活时的文字
  activeText: {
    type: String,
    default: '已解锁'
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'default' // large / default / small
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleClick = () => {
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style scoped>
.toggle-lock-btn {
  transition: all 0.22s ease !important;
  border: none !important;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  /* 默认：灰色 + 下沉 */
  background-color: #e5e7eb !important;
  color: #6b7280 !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12) !important;
}

/* 激活：Primary 蓝 + 凸起 */
.toggle-lock-btn.active {
  background-color: var(--el-color-primary) !important;
  color: #fff !important;
  box-shadow:
      0 4px 8px -1px rgba(64, 158, 255, 0.45),
      0 2px 4px -2px rgba(64, 158, 255, 0.3) !important;
  transform: translateY(-1px);
}

/* 按下时回弹 */
.toggle-lock-btn:active {
  transform: translateY(0) !important;
}

/* 图标微调 */
.toggle-lock-btn .icon {
  font-size: 16px;
}
</style>