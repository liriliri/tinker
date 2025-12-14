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
import { getSettingsStore } from './store'
import log from 'share/common/log'
import map from 'licia/map'
import * as terminal from 'share/main/window/terminal'
import * as process from 'share/main/window/process'
import * as about from 'share/main/window/about'
import { isDev } from 'share/common/util'

const logger = log('tray')
let tray: Tray | null = null

const settingsStore = getSettingsStore()

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

  const themeMenu: MenuItemConstructorOptions[] = map(
    ['system', 'light', 'dark'],
    (theme) => {
      return {
        label: t(theme === 'system' ? 'sysPreference' : theme),
        type: 'radio',
        checked: settingsStore.get('theme') === theme,
        click() {
          settingsStore.set('theme', theme)
        },
      }
    }
  )

  const langMenu: MenuItemConstructorOptions[] = map(
    ['system', 'en-US', 'zh-CN'],
    (lang) => {
      let label = t('sysPreference')
      if (lang === 'en-US') {
        label = 'English'
      } else if (lang === 'zh-CN') {
        label = '中文'
      }

      return {
        label,
        type: 'radio',
        checked: settingsStore.get('language') === lang,
        click() {
          settingsStore.set('language', lang)
          relaunchApp()
        },
      }
    }
  )

  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
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
      label: t('settings'),
      submenu: [
        {
          label: t('theme'),
          submenu: themeMenu,
        },
        {
          label: t('language'),
          submenu: langMenu,
        },
        {
          label: t('useNativeTitlebar'),
          type: 'checkbox',
          checked: settingsStore.get('useNativeTitlebar'),
          click(item) {
            settingsStore.set('useNativeTitlebar', item.checked)
            relaunchApp()
          },
        },
        {
          type: 'separator',
        },
        {
          label: t('openAtLogin'),
          type: 'checkbox',
          checked: settingsStore.get('openAtLogin'),
          click(item) {
            settingsStore.set('openAtLogin', item.checked)
          },
        },
        {
          label: t('silentStart'),
          type: 'checkbox',
          checked: settingsStore.get('silentStart'),
          click(item) {
            settingsStore.set('silentStart', item.checked)
          },
        },
      ],
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

function relaunchApp() {
  setTimeout(() => {
    app.relaunch()
    app.exit()
  }, 500)
}
