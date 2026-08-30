function applyTheme() {
  const root = document.documentElement
  const shouldUseDark = root.dataset.theme === 'dark'

  root.classList.toggle('dark', shouldUseDark)
}

export function setupTheme() {
  applyTheme()
}
