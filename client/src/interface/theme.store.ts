import {proxy, useSnapshot} from 'valtio'

type Theme = 'dark' | 'light'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const themeStore = proxy<{theme: Theme}>({
  theme: getInitialTheme()
})

export function toggleTheme() {
  themeStore.theme = themeStore.theme === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', themeStore.theme)
  document.body.dataset.theme = themeStore.theme
}

export function initTheme() {
  document.body.dataset.theme = themeStore.theme
}

export function useTheme() {
  return useSnapshot(themeStore)
}
