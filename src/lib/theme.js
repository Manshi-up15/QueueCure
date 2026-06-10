const STORAGE_KEY = 'queuecure:theme'

export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function storeTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
}
