import * as window from 'share/main/lib/window'

export function showWin() {
  const win = window.create({
    name: 'main',
    minWidth: 800,
    minHeight: 600,
    width: 800,
    height: 600,
    titlebar: false,
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.focus()
  win.setVisibleOnAllWorkspaces(false, {
    visibleOnFullScreen: true,
  })
  window.loadPage(win)
}
