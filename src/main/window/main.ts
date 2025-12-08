import { IpcDragMain } from 'common/types'
import { BrowserWindow, screen } from 'electron'
import once from 'licia/once'
import { handleEvent } from 'share/main/lib/util'
import * as window from 'share/main/lib/window'
import { closePlugin, getAttachedPlugin, layoutPlugin } from '../lib/plugin'

let win: BrowserWindow | null = null

export function showWin() {
  if (win) {
    win.show()
    win.focus()
    return
  }

  initIpc()

  win = window.create({
    name: 'main',
    titlebar: false,
  })

  win.on('close', () => {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        closePlugin(plugin.id)
      }
      win.destroy()
    }
    win = null
  })

  win.on('resize', () => {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        layoutPlugin(plugin.id)
      }
    }
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
