<!-- 二级路由容器：必须自带 router-view，子页面在此切换 -->
<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade-transform" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style scoped>
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.25s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
