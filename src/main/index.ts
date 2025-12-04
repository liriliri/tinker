import { app } from 'electron'
import log from 'share/common/log'
import * as tray from './lib/tray'
import * as main from './window/main'
import * as plugin from './lib/plugin'
import * as window from 'share/main/lib/window'
import noop from 'licia/noop'
import 'share/main'

const logger = log('main')
logger.info('start', process.argv)

window.setDefaultOptions({
  minWidth: 800,
  minHeight: 600,
  width: 800,
  height: 600,
})

app.on('ready', () => {
  logger.info('app ready')

  plugin.init()
  tray.init()
  main.showWin()
})

app.on('window-all-closed', noop)
