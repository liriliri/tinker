import isMac from 'licia/isMac'
import * as window from 'share/main/lib/window'
import isEmpty from 'licia/isEmpty'
import { app } from 'electron'
import contain from 'licia/contain'

export function hide() {
  if (!isMac) {
    return
  }

  const visibleWins = window.getVisibleWins()
  const onlyMain =
    visibleWins.length === 1 && visibleWins[0] === window.getWin('main')

  if (isEmpty(visibleWins)) {
    app.dock.hide()
  } else if (onlyMain) {
    const win = window.getWin('main')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    win.focus()
    win.setVisibleOnAllWorkspaces(false, {
      visibleOnFullScreen: true,
    })
  }
}

export function show() {
  if (!isMac) {
    return
  }

  setTimeout(() => {
    const visibleWins = window.getVisibleWins()
    const noMain = !contain(visibleWins, window.getWin('main'))

    if (visibleWins.length > 1 || noMain) {
      app.dock.show()
    }
  }, 500)
}
