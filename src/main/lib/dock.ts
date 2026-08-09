import * as window from 'share/main/lib/window'
import isEmpty from 'licia/isEmpty'
import { app } from 'electron'

const workspaceOpts = {
  visibleOnFullScreen: true,
  skipTransformProcessType: true,
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
}
