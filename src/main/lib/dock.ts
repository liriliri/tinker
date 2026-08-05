import * as window from 'share/main/lib/window'
import isEmpty from 'licia/isEmpty'
import { app } from 'electron'

export function hide() {
  if (!app.dock) {
    return
  }

  const visibleWins = window.getVisibleWins()
  const mainWin = window.getWin('main')
  const onlyMain =
    visibleWins.length === 1 && visibleWins[0] === mainWin

  if (isEmpty(visibleWins) || onlyMain) {
    app.dock.hide()
    if (onlyMain && mainWin) {
      mainWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      mainWin.focus()
      mainWin.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: true,
      })
    }
  }
}

export function show() {
  if (!app.dock) {
    return
  }

  app.dock.show()
}
