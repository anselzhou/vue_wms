import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 1. 必须引入 path

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            // 2. 必须配置这一段，告诉 Vite @ 代表 src
            '@': path.resolve(__dirname, 'src')
        }
    }
})

