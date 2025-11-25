import { app } from 'electron'
import log from 'share/common/log'
import * as main from './window/main'
import * as language from 'share/main/lib/language'
import * as theme from 'share/main/lib/theme'
import * as ipc from 'share/main/lib/ipc'
import { setupTitlebar } from 'custom-electron-titlebar/main'

const logger = log('main')
logger.info('start', process.argv)

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.setName('Tinker')

app.on('ready', () => {
  logger.info('app ready')

  setupTitlebar()
  language.init()
  theme.init()
  ipc.init()
  main.showWin()
})
