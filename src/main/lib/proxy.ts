import { app, ProxyConfig, session } from 'electron'
import { getSettingsStore } from './store'
import isStrBlank from 'licia/isStrBlank'
import log from 'share/common/log'

const logger = log('proxy')
const store = getSettingsStore()

function setProxy(proxyConfig: ProxyConfig) {
  app.setProxy(proxyConfig)
  session.defaultSession.setProxy(proxyConfig)
}

function updateProxy() {
  const mode = store.get('proxyMode')
  if (mode === 'system' || mode === 'direct') {
    setProxy({
      mode,
    })
  } else if (mode === 'fixed_servers') {
    const host = store.get('proxyHost')
    if (!isStrBlank(host)) {
      setProxy({
        mode,
        proxyRules: host,
      })
    } else {
      setProxy({
        mode: 'system',
      })
    }
  }
}

export function init() {
  logger.info('init')
  updateProxy()
  store.on('change', (name) => {
    if (name === 'proxyMode' || name === 'proxyHost') {
      updateProxy()
    }
  })
}
