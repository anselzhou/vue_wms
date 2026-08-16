import { ref, computed, watch } from 'vue'

export type ThemeName = 'violet' | 'blue'

export interface ThemeOption {
  name: ThemeName
  label: string
  /** 预览色块 */
  swatch: string
  description: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    name: 'violet',
    label: '紫罗兰',
    swatch: '#6750a4',
    description: 'Material 风格，柔和沉稳'
  },
  {
    name: 'blue',
    label: 'Primary Blue',
    swatch: '#1677ff',
    description: '清爽企业蓝，专业高效'
  }
]

const STORAGE_KEY = 'wms-theme'

const theme = ref<ThemeName>(readStoredTheme())

function readStoredTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'violet' || stored === 'blue') return stored
  return 'violet'
}

function applyTheme(name: ThemeName) {
  document.documentElement.setAttribute('data-theme', name)
}

watch(
  theme,
  (name) => {
    applyTheme(name)
    localStorage.setItem(STORAGE_KEY, name)
  }
)

/** 在 Vue 挂载前调用，避免首屏闪烁 */
export function initTheme() {
  applyTheme(theme.value)
}

export function useTheme() {
  const currentOption = computed(
    () => THEME_OPTIONS.find((t) => t.name === theme.value) ?? THEME_OPTIONS[0]
  )

  function setTheme(name: ThemeName) {
    theme.value = name
  }

  /** 在两个主题间一键切换 */
  function toggleTheme() {
    theme.value = theme.value === 'violet' ? 'blue' : 'violet'
  }

  return {
    theme: computed(() => theme.value),
    currentOption,
    themeOptions: THEME_OPTIONS,
    setTheme,
    toggleTheme
  }
}
