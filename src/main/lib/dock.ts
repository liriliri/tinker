import * as window from 'share/main/lib/window'
import isEmpty from 'licia/isEmpty'
import { app, nativeImage } from 'electron'
import fs from 'fs-extra'
import { isDev } from 'share/common/util'
import { resolve, resolveResources } from 'share/main/lib/util'

const workspaceOpts = {
  visibleOnFullScreen: true,
  skipTransformProcessType: true,
}

let dockIcon: Electron.NativeImage | null = null

async function getDockIcon() {
  if (dockIcon && !dockIcon.isEmpty()) {
    return dockIcon
  }

  const iconPath = isDev()
    ? resolve('build/icon.png')
    : resolveResources('icon.icns')

  if (await fs.pathExists(iconPath)) {
    dockIcon = nativeImage.createFromPath(iconPath)
  }

  return dockIcon
}

export function hide() {
  if (!app.dock) {
    return
  }

  const visibleWins = window.getVisibleWins()
  const mainWin = window.getWin('main')
  const onlyMain = visibleWins.length === 1 && visibleWins[0] === mainWin

  if (isEmpty(visibleWins) || onlyMain) {
    app.dock.hide()
    if (onlyMain && mainWin) {
      mainWin.setVisibleOnAllWorkspaces(true, workspaceOpts)
      mainWin.focus()
      mainWin.setVisibleOnAllWorkspaces(false, workspaceOpts)
    }
  }
}

export async function show() {
  if (!app.dock) {
    return
  }

  await app.dock.show()

  // LSUIElement + dock.hide/show can leave a blank/dot placeholder; reset the icon.
  const icon = await getDockIcon()
  if (icon && !icon.isEmpty()) {
    app.dock.setIcon(icon)
  }
}
