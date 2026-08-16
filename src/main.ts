// src/main.ts
import { createApp } from 'vue';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import './style.css';
import ElementPlus from 'element-plus'
import { initTheme } from './composables/useTheme'

initTheme()

const app = createApp(App);

app.use(router);
app.use(ElementPlus);
app.mount('#app');
