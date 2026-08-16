<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <!-- 基础用法 -->
    <ToggleLockButton v-model="isUnlocked" />

    <!-- 自定义文字 -->
    <ToggleLockButton
        v-model="isUnlocked2"
        inactive-text=""
        active-text=""
    />

    <!-- 小尺寸 -->
    <ToggleLockButton v-model="isUnlocked3" size="small" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToggleLockButton from '@/components/ToggleLockButton.vue'

const isUnlocked = ref(false)
const isUnlocked2 = ref(false)
const isUnlocked3 = ref(true)
</script>
