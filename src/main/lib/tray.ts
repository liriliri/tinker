import { app, Menu, nativeImage, Tray } from 'electron'
import { resolveResources } from 'share/main/lib/util'
import * as main from '../window/main'
import isMac from 'licia/isMac'
import { t } from 'common/util'
import log from 'share/common/log'

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
    if (!isMac) {
      main.showWin()
    }
  })

  updateContextMenu()
}

async function updateContextMenu() {
  if (!tray) {
    return
  }

  logger.info('update context menu')

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
      label: t('quitTinker'),
      click() {
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}
