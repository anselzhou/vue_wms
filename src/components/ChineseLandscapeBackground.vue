<template>
  <div class="landscape-bg" aria-hidden="true">
    <svg
      class="landscape-svg"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <defs>
        <filter id="ink-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e7ece9" stop-opacity="0.9" />
          <stop offset="1" stop-color="#ccd7d2" stop-opacity="0.95" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#c05a3d" stop-opacity="0.18" />
          <stop offset="1" stop-color="#c05a3d" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 红日与光晕 -->
      <g class="sun">
        <circle cx="470" cy="330" r="170" fill="url(#sun-glow)" />
        <circle cx="470" cy="330" r="66" fill="#c05a3d" opacity="0.86" />
      </g>

      <!-- 远山晕染（水墨泼墨效果） -->
      <path
        d="M-60,640 C180,470 420,540 620,480 C800,440 980,520 1180,480 C1380,440 1560,500 1760,470 C1860,455 1900,470 1980,460 L1980,1080 L-60,1080 Z"
        fill="#c9d1ce"
        opacity="0.45"
        filter="url(#ink-blur)"
      />

      <!-- 远山（最淡） -->
      <path
        d="M0,540 C200,400 400,500 600,440 C750,390 900,480 1100,450 C1300,420 1500,490 1700,440 C1800,410 1880,440 1920,430 L1920,1080 L0,1080 Z"
        fill="#ccd4d2"
        opacity="0.6"
      />
      <path
        d="M1200,570 C1350,470 1500,510 1650,480 C1780,450 1880,510 1920,490 L1920,1080 L1200,1080 Z"
        fill="#d9dfdd"
        opacity="0.5"
      />

      <!-- 云雾（后层） -->
      <g class="cloud cloud--back" fill="#ffffff" opacity="0.55">
        <ellipse cx="320" cy="470" rx="250" ry="42" />
        <ellipse cx="1500" cy="540" rx="300" ry="48" />
        <ellipse cx="1050" cy="500" rx="210" ry="36" />
      </g>

      <!-- 中景山 -->
      <path
        d="M0,710 C150,570 350,610 500,550 C620,510 750,590 900,540 C1000,510 1100,570 1200,530 C1300,500 1400,540 1500,510 C1600,480 1720,530 1920,510 L1920,1080 L0,1080 Z"
        fill="#9aa5a2"
        opacity="0.78"
      />
      <path
        d="M1000,790 C1150,670 1300,710 1450,650 C1580,600 1720,670 1920,620 L1920,1080 L1000,1080 Z"
        fill="#84918d"
        opacity="0.8"
      />

      <!-- 云雾（中层） -->
      <g class="cloud cloud--mid" fill="#ffffff" opacity="0.62">
        <ellipse cx="720" cy="600" rx="280" ry="42" />
        <ellipse cx="1580" cy="650" rx="240" ry="38" />
        <ellipse cx="200" cy="670" rx="220" ry="34" />
      </g>

      <!-- 中景松树（右侧山巅） -->
      <g class="pine pine--right">
        <path d="M1648,662 L1698,726 L1598,726 Z" fill="#45524e" stroke-linejoin="round" />
        <path d="M1648,682 L1686,728 L1610,728 Z" fill="#3d4a46" stroke-linejoin="round" />
        <path d="M1648,700 L1672,730 L1624,730 Z" fill="#37433f" stroke-linejoin="round" />
        <path d="M1646,732 L1652,788 L1642,788 Z" fill="#3f4b47" />
      </g>

      <!-- 水面 -->
      <rect x="0" y="860" width="1920" height="220" fill="url(#water-grad)" />
      <!-- 水波纹 -->
      <g stroke="#a5b4ae" stroke-width="2" stroke-linecap="round" opacity="0.45" fill="none">
        <path d="M140,920 q40,-8 80,0 q40,-8 80,0" />
        <path d="M560,950 q40,-8 80,0 q40,-8 80,0" />
        <path d="M1080,900 q40,-8 80,0 q40,-8 80,0" />
        <path d="M1500,960 q40,-8 80,0 q40,-8 80,0" />
        <path d="M760,990 q40,-8 80,0 q40,-8 80,0" />
        <path d="M1700,930 q40,-8 80,0 q40,-8 80,0" />
      </g>

      <!-- 近景山石（左下） -->
      <path
        d="M0,860 C100,770 220,800 320,750 C430,695 530,760 640,715 C720,685 800,740 900,700 L960,1080 L0,1080 Z"
        fill="#5c6b67"
      />
      <!-- 近景山石（右下） -->
      <path
        d="M1420,870 C1520,790 1620,820 1720,770 C1820,730 1870,780 1920,750 L1920,1080 L1420,1080 Z"
        fill="#5c6b67"
      />

      <!-- 近景松树（左下岸边） -->
      <g class="pine pine--left">
        <path d="M330,828 L422,940 L238,940 Z" fill="#3a4541" stroke-linejoin="round" />
        <path d="M330,858 L398,942 L262,942 Z" fill="#323e3a" stroke-linejoin="round" />
        <path d="M330,886 L374,944 L286,944 Z" fill="#2b3733" stroke-linejoin="round" />
        <path d="M324,944 L332,1032 L316,1032 Z" fill="#37423e" />
      </g>

      <!-- 飞鸟 -->
      <g fill="none" stroke="#6a7570" stroke-width="2.6" stroke-linecap="round">
        <path d="M520,205 q14,-14 28,0 q14,-14 28,0" />
        <path d="M620,168 q10,-10 20,0 q10,-10 20,0" stroke-width="2" />
        <path d="M585,232 q12,-12 24,0 q12,-12 24,0" stroke-width="1.8" />
        <path d="M468,242 q8,-8 16,0 q8,-8 16,0" stroke-width="1.6" />
        <path d="M660,210 q7,-7 14,0 q7,-7 14,0" stroke-width="1.4" />
      </g>

      <!-- 朱砂印章 -->
      <g transform="translate(1812,92)">
        <rect width="52" height="52" rx="6" fill="#b8493a" opacity="0.85" />
        <text
          x="26"
          y="34"
          text-anchor="middle"
          font-size="18"
          font-weight="600"
          fill="#f7f1e6"
          font-family="'KaiTi','STKaiti','SimSun',serif"
        >WMS</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
// 中国风水墨山水背景组件（纯 SVG 绘制，无外部图片依赖）
</script>

<style scoped>
.landscape-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 70% 55% at 78% 18%, rgba(201, 209, 206, 0.5) 0%, transparent 62%),
    linear-gradient(160deg, #f4f2ea 0%, #e9ece8 42%, #dde4e0 100%);
}

.landscape-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.cloud {
  transform-box: fill-box;
  animation: cloud-drift 30s ease-in-out infinite alternate;
}

.cloud--mid {
  animation-duration: 38s;
  animation-delay: -12s;
}

.sun {
  transform-box: fill-box;
  animation: sun-breathe 6s ease-in-out infinite;
}

@keyframes cloud-drift {
  from { transform: translateX(-20px); }
  to { transform: translateX(20px); }
}

@keyframes sun-breathe {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .cloud,
  .sun {
    animation: none;
  }
}
</style>
