import { app, Menu, protocol } from 'electron'
import log from 'share/common/log'
import * as tray from './lib/tray'
import * as main from './window/main'
import * as plugin from './lib/plugin'
import * as window from 'share/main/lib/window'
import * as terminal from 'share/main/window/terminal'
import * as autoLaunch from 'share/main/lib/autoLaunch'
import * as dock from './lib/dock'
import noop from 'licia/noop'
import fixPath from 'fix-path'
import { getSettingsStore } from './lib/store'
import * as shortcut from './lib/shortcut'
import 'share/main'

const logger = log('main')
logger.info('start', process.argv)

fixPath()

const settingsStore = getSettingsStore()

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

app.on('ready', () => {
  logger.info('app ready')

  Menu.setApplicationMenu(null)
  autoLaunch.init()
  terminal.init()
  plugin.init()
  tray.init()
  if (!autoLaunch.wasOpenedAtLogin() && !settingsStore.get('silentStart')) {
    main.showWin()
  } else {
    dock.hide()
  }
  shortcut.register(settingsStore.get('showShortcut'), () => main.showWin())
  settingsStore.on('change', (key, val, oldVal) => {
    if (key === 'showShortcut') {
      shortcut.unregister(oldVal)
      shortcut.register(val, () => main.showWin())
    }
  })
})

app.on('window-all-closed', noop)
