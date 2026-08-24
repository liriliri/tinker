import types from 'licia/types'
import { BrowserWindow, WebContents, WebContentsView } from 'electron'

export const PLUGIN_PARTITION = 'persist:plugin'

export interface PluginViewEntry {
  view: WebContentsView
  win: BrowserWindow | null
  childWindows: Set<BrowserWindow>
}

export const pluginViews: types.PlainObj<PluginViewEntry> = {}

export function setPluginView(
  id: string,
  view: WebContentsView,
  win: BrowserWindow | null
) {
  pluginViews[id] = { view, win, childWindows: new Set() }
}

export function findPluginByWebContents(webContents: WebContents):
  | {
      id: string
      entry: PluginViewEntry
    }
  | undefined {
  for (const id in pluginViews) {
    const entry = pluginViews[id]
    if (entry.view.webContents === webContents) {
      return { id, entry }
    }
    for (const childWin of entry.childWindows) {
      if (childWin.webContents === webContents) {
        return { id, entry }
      }
    }
  }
}
