import {
  app,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  Tray,
} from 'electron'
import { resolveResources } from 'share/main/lib/util'
import * as main from '../window/main'
import isMac from 'licia/isMac'
import { t } from 'common/util'
import { getSettingsStore } from './store'
import log from 'share/common/log'
import map from 'licia/map'
import * as terminal from 'share/main/window/terminal'
import * as process from 'share/main/window/process'

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
          setTimeout(() => {
            app.relaunch()
            app.exit()
          }, 500)
        },
      }
    }
  )

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
      ],
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
