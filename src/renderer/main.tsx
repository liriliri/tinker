import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import log from 'share/common/log'
import pkg from '../../package.json'
import 'share/renderer/main'
import 'share/renderer/luna.scss'
import 'share/renderer/main.scss'
import './icon.css'
import { i18n } from 'common/util'

const logger = log('renderer')
logger.info('start')

function renderApp() {
  logger.info('render app')

  const container: HTMLElement = document.getElementById('app') as HTMLElement

  const App = lazy(() => import('./main/App.js') as Promise<any>)
  const title = pkg.productName

  preload.setTitle(title)

  createRoot(container).render(<App />)
}

;(async function () {
  const language = await main.getLanguage()
  i18n.locale(language)

  renderApp()
})()
