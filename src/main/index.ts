import { app } from 'electron'
import log from 'share/common/log'
import * as tray from './lib/tray'
import * as main from './window/main'
import * as plugin from './lib/plugin'
import noop from 'licia/noop'
import 'share/main'

const logger = log('main')
logger.info('start', process.argv)

app.on('ready', () => {
  logger.info('app ready')

  plugin.init()
  tray.init()
  main.showWin()
})

app.on('window-all-closed', noop)
