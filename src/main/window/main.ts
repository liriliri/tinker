import { IpcDragMain } from 'common/types'
import { BrowserWindow, screen } from 'electron'
import once from 'licia/once'
import { handleEvent } from 'share/main/lib/util'
import * as window from 'share/main/lib/window'

let win: BrowserWindow | null = null

export function showWin() {
  if (win) {
    win.focus()
    return
  }

  initIpc()

  win = window.create({
    name: 'main',
    minWidth: 800,
    minHeight: 600,
    width: 800,
    height: 600,
    titlebar: false,
  })

  win.on('close', () => {
    win?.destroy()
    win = null
  })

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') {
      return
    }

    if (input.key === 'Escape') {
      win?.close()
    }
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.focus()
  win.setVisibleOnAllWorkspaces(false, {
    visibleOnFullScreen: true,
  })
  window.loadPage(win)
}

const initIpc = once(() => {
  handleEvent('dragMain', <IpcDragMain>((x, y) => {
    if (!win) {
      return
    }

    const cursorPos = screen.getCursorScreenPoint()
    win.setBounds({
      x: cursorPos.x - x,
      y: cursorPos.y - y,
    })
  }))
})
