import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()

