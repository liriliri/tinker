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
import { openPlugin, closePlugin, getAttachedPlugin } from './plugin/view'
import * as window from 'share/main/lib/window'
import { installSkill, isSkillInstalled } from './agent'
import { installCli, isCliInstalled } from './shell'

const logger = log('tray')
let tray: Tray | null = null
let cliInstalled = false
let skillInstalled = false

export async function init() {
  ;[cliInstalled, skillInstalled] = await Promise.all([
    isCliInstalled(),
    isSkillInstalled(),
  ])
  const iconPath = isMac ? 'tray-template.png' : 'tray.png'
  const icon = nativeImage.createFromPath(resolveResources(iconPath))
  if (isMac) {
    icon.setTemplateImage(true)
  }
  tray = new Tray(icon)
  tray.setToolTip(`${PRODUCT_NAME} ${VERSION}`)
  if (isMac) {
    tray.on('click', () => {
      main.showWin()
    })
    tray.on('right-click', () => {
      updateContextMenu()
    })
  } else {
    tray.on('click', () => {
      main.showWin()
    })
    updateContextMenu()
  }
}

function updateContextMenu() {
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
    ...(!cliInstalled || !skillInstalled
      ? [
          { type: 'separator' as const },
          ...(!cliInstalled
            ? [
                {
                  label: `${t('installCli')}...`,
                  async click() {
                    try {
                      await installCli()
                      cliInstalled = true
                      updateContextMenu()
                    } catch {
                      // user cancelled or failed
                    }
                  },
                },
              ]
            : []),
          ...(!skillInstalled
            ? [
                {
                  label: `${t('installAgentSkill')}...`,
                  async click() {
                    try {
                      await installSkill()
                      skillInstalled = true
                      updateContextMenu()
                    } catch {
                      // failed to install
                    }
                  },
                },
              ]
            : []),
        ]
      : []),
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
        const mainWin = window.getWin('main')
        if (mainWin) {
          const plugin = getAttachedPlugin(mainWin)
          if (plugin) {
            closePlugin(plugin.id)
          }
        }
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
        setTimeout(() => app.quit(), 100)
      },
    },
    {
      label: t('quit'),
      click() {
        app.quit()
      },
    },
  ])
  if (isMac) {
    tray.popUpContextMenu(contextMenu)
  } else {
    tray.setContextMenu(contextMenu)
  }
}
