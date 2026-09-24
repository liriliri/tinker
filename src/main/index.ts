import * as tracing from './lib/tracing'
import { app, Menu, protocol } from 'electron'
import log from 'share/common/log'
import * as tray from './lib/tray'
import * as main from './window/main'
import * as plugin from './lib/plugin'
import * as application from './lib/app'
import * as window from 'share/main/lib/window'
import * as terminal from 'share/main/window/terminal'
import * as autoLaunch from 'share/main/lib/autoLaunch'
import * as dock from './lib/dock'
import noop from 'licia/noop'
import { getSettingsStore } from './lib/store'
import * as shortcut from './lib/shortcut'
import * as mouse from './lib/mouse'
import * as keyboard from './lib/keyboard'
import * as proxy from './lib/proxy'
import * as cli from './cli/handler'
import { startFixPath } from './lib/fixPath'
import 'share/main'

tracing.markImportsDone()

const logger = log('main')
logger.info('start', process.argv)

const settingsStore = getSettingsStore()

if (!settingsStore.get('hardwareAcceleration')) {
  app.disableHardwareAcceleration()
}

window.setDefaultOptions({
  minWidth: 800,
  minHeight: 600,
  width: 800,
  height: 600,
  customTitlebar: !settingsStore.get('useNativeTitlebar'),
})

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'plugin',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
    },
  },
])

cli.init()

tracing.begin('wait-app-ready')

app.on('ready', () => {
  tracing.end()
  logger.info('app ready')

  startFixPath()

  Menu.setApplicationMenu(null)
  autoLaunch.init()
  terminal.init()
  proxy.init()
  plugin.init()
  application.init()

  tray.init()

  const silentStart =
    autoLaunch.wasOpenedAtLogin() || settingsStore.get('silentStart')

  if (!silentStart) {
    main.showWin()
    tracing.finishAfter(tracing.waitFirstShow())
  } else {
    dock.hide()
    tracing.finishAfter()
  }

  shortcut.init()
  mouse.init()
  keyboard.init()
})

app.on('window-all-closed', noop)
