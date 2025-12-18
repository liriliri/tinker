import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'

function renderApp() {
  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
}

;(async function () {
  // Get user language setting from tinker API
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  renderApp()
})()
