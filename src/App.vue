 <template>
   <!-- 路由出口：所有路由组件都会渲染到这里 -->
   <router-view />
 </template>
 
 <script setup>
 // 无需额外代码，路由会自动接管页面渲染
 </script>
 
 <style>
 /* 全局基础样式重置 */
 * {
   margin: 0;
   padding: 0;
   box-sizing: border-box;
 }
 
 html, body, #app {
   height: 100%;
   width: 100%;
 }
 </style>

