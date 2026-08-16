<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <!-- 基础用法 -->
    <ToggleLockButton v-model="isUnlocked" />

    <!-- 自定义文字 -->
    <ToggleLockButton
        v-model="isUnlocked2"
        inactive-text="点击解锁"
        active-text="已解锁"
    />

    <!-- 小尺寸 -->
    <ToggleLockButton v-model="isUnlocked3" size="small" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToggleLockButton from './ToggleLockButton.vue'

const isUnlocked = ref(false)
const isUnlocked2 = ref(false)
const isUnlocked3 = ref(true)
</script>