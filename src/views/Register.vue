<template>
  <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span class="text-white text-3xl font-bold">R</span>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">RuoYi</div>
            <div class="text-zinc-400 text-sm -mt-1">管理系统</div>
          </div>
        </div>
      </div>

      <!-- 注册卡片 -->
      <div class="bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800">
        <h1 class="text-2xl font-semibold text-white text-center mb-8">创建新账号</h1>

        <form class="space-y-6">
          <div>
            <label class="block text-zinc-400 text-sm mb-2">用户名</label>
            <div class="relative">
              <User class="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="请输入用户名"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-zinc-400 text-sm mb-2">邮箱</label>
            <div class="relative">
              <Mail class="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="email" placeholder="请输入邮箱"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-zinc-400 text-sm mb-2">密码</label>
            <div class="relative">
              <Lock class="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="password" placeholder="请输入密码（不少于8位）"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-zinc-400 text-sm mb-2">确认密码</label>
            <div class="relative">
              <Lock class="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="password" placeholder="请再次输入密码"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <button type="submit"
            class="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-medium text-lg transition-colors mt-4">
            立即注册
          </button>
        </form>

        <!-- 切换到登录 -->
        <div class="text-center mt-8 text-zinc-400">
          已有账号？
          <RouterLink to="/login" class="text-blue-500 hover:text-blue-400 font-medium">
            立即登录 →
          </RouterLink>
        </div>
      </div>

      <p class="text-center text-zinc-500 text-sm mt-8">
        © 2026 RuoYi-Vue3 All Rights Reserved
      </p>
    </div>
  </div>
</template>

<script setup>
import { User, Mail, Lock } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>
