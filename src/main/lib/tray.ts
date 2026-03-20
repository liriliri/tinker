import {
  app,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  Tray,
  shell,
} from 'electron'
import { getUserDataPath, resolveResources } from 'share/main/lib/util'
import * as main from '../window/main'
import isMac from 'licia/isMac'
import { t } from 'common/util'
import log from 'share/common/log'
import * as terminal from 'share/main/window/terminal'
import * as process from 'share/main/window/process'
import * as about from 'share/main/window/about'
import { isDev } from 'share/common/util'
import * as updater from 'share/main/lib/updater'
import { openPlugin } from './plugin/view'

const logger = log('tray')
let tray: Tray | null = null

export function init() {
  const iconPath = isMac ? 'tray-template.png' : 'tray.png'
  const icon = nativeImage.createFromPath(resolveResources(iconPath))
  if (isMac) {
    icon.setTemplateImage(true)
  }
  tray = new Tray(icon)
  tray.setToolTip(`${PRODUCT_NAME} ${VERSION}`)
  tray.on('click', () => {
    updateContextMenu()
    if (!isMac) {
      main.showWin()
    }
  })
  tray.on('right-click', updateContextMenu)

  updateContextMenu()
}

async function updateContextMenu() {
  if (!tray) {
    return
  }

  logger.info('update context menu')

  const helpMenu: MenuItemConstructorOptions = {
    label: t('help'),
    submenu: [
      {
        label: t('donate'),
        click() {
          shell.openExternal('http://surunzi.com/wechatpay.html')
        },
      },
      {
        label: t('reportIssue'),
        click() {
          shell.openExternal('https://github.com/liriliri/tinker/issues')
        },
      },
      {
        type: 'separator',
      },
      ...(isDev()
        ? [
            {
              label: t('openUserDataDir'),
              click() {
                shell.openPath(getUserDataPath(''))
              },
            },
            {
              label: t('debugMainProcess'),
              click() {
                process.debugMainProcess()
              },
            },
          ]
        : []),
    ],
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('show'),
      click() {
        main.showWin()
      },
    },
    {
      type: 'separator',
    },
    {
      label: `${t('settings')}...`,
      click() {
        openPlugin('tinker-settings', true)
      },
    },
    {
      label: t('tools'),
      submenu: [
        {
          label: t('terminal'),
          click() {
            terminal.showWin()
          },
        },
        {
          label: t('processManager'),
          click() {
            process.showWin()
          },
        },
      ],
    },
    helpMenu,
    {
      type: 'separator',
    },
    {
      label: t('aboutTinker'),
      click() {
        about.showWin()
      },
    },
    {
      label: `${t('checkUpdate')}...`,
      click() {
        main.showWin()
        updater.checkUpdate()
      },
    },
    {
      type: 'separator',
    },
    {
      label: t('restart'),
      click() {
        app.relaunch()
        app.exit()
      },
    },
    {
      label: t('quit'),
      click() {
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}
