import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import log from 'share/common/log'
import pkg from '../../package.json'
import 'share/renderer/main'
import 'luna-icon-list/css'
import 'luna-split-pane/css'
import 'luna-toolbar/css'
import 'luna-data-grid/css'
import 'luna-modal/css'
import 'luna-performance-monitor/css'
import 'luna-scrollbar/css'
import 'share/renderer/luna.scss'
import './luna.scss'
import 'share/renderer/main.scss'
import './icon.css'
import { i18n } from 'common/util'
import getUrlParam from 'licia/getUrlParam'
import { t } from 'common/util'
import LunaModal from 'luna-modal'

const logger = log('renderer')
logger.info('start')

function renderApp() {
  logger.info('render app')

  const container: HTMLElement = document.getElementById('app') as HTMLElement

  let App = lazy(() => import('./main/App.js') as Promise<any>)
  let title = pkg.productName

  const page = getUrlParam('page')

  switch (page) {
    case 'plugin':
      title = getUrlParam('title') || ''
      break
    case 'terminal':
      App = lazy(() => import('share/renderer/terminal/App.js') as Promise<any>)
      title = t('terminal')
      break
    case 'process':
      App = lazy(() => import('share/renderer/process/App.js') as Promise<any>)
      title = t('processManager')
      break
    case 'about':
      App = lazy(() => import('share/renderer/about/App.js') as Promise<any>)
      title = t('aboutTinker')
      break
  }

  preload.setTitle(title)

  if (page !== 'plugin') {
    createRoot(container).render(<App />)
  }
}

;(async function () {
  const language = await main.getLanguage()
  i18n.locale(language)

  LunaModal.i18n.locale('en-US')
  LunaModal.i18n.set('en-US', {
    ok: t('ok'),
    cancel: t('cancel'),
  })

  renderApp()
})()
