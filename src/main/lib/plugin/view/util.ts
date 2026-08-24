import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import { BrowserWindow, WebContentsView } from 'electron'

const transparentWindows = new WeakSet<BrowserWindow>()

function getBgColor() {
  return theme.get() === 'dark' ? colorBgContainerDark : colorBgContainer
}

export function markTransparent(win: BrowserWindow) {
  transparentWindows.add(win)
}

export function applyWindowTheme(win: BrowserWindow) {
  if (!transparentWindows.has(win)) {
    win.setBackgroundColor(getBgColor())
  }
  win.webContents.send('changeTheme')
}

export function applyViewTheme(view: WebContentsView) {
  view.setBackgroundColor(getBgColor())
  view.webContents.send('changeTheme')
}
