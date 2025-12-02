import { app } from 'electron'
import log from 'share/common/log'
import * as tray from './lib/tray'
import * as main from './window/main'
import noop from 'licia/noop'
import 'share/main'

const logger = log('main')
logger.info('start', process.argv)

app.on('ready', () => {
  logger.info('app ready')

  tray.init()
  main.showWin()
})

app.on('window-all-closed', noop)
