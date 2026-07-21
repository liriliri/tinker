import { createRoot } from 'react-dom/client'
import 'share/renderer/main.scss'
import { i18n, t } from 'common/util'

async function start() {
  try {
    const [langRes, themeRes] = await Promise.all([
      fetch('/api/language'),
      fetch('/api/theme'),
    ])
    if (langRes.ok) {
      const data = (await langRes.json()) as { language?: string }
      i18n.locale(data.language === 'zh-CN' ? 'zh-CN' : 'en-US')
    }
    if (themeRes.ok) {
      const data = (await themeRes.json()) as { theme?: string }
      document.body.classList.toggle(
        '-theme-with-dark-background',
        data.theme === 'dark'
      )
    }
  } catch {
    // keep defaults
  }
  document.title = t('remote')

  const { default: App } = await import('./App')
  createRoot(document.getElementById('app') as HTMLElement).render(<App />)
}

start()
