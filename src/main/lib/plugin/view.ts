import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcClearPluginData,
  IpcExportPluginData,
  IpcImportPluginData,
  IpcOpenPlugin,
  IpcReopenPlugin,
  IpcShowPluginContextMenu,
  IpcTogglePluginDevtools,
  IPlugin,
} from 'common/types'
import path from 'path'
import startWith from 'licia/startWith'
import types from 'licia/types'
import each from 'licia/each'
import { BrowserWindow, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import * as pluginWin from '../../window/plugin'
import isMac from 'licia/isMac'
import contextMenu from '../contextMenu'
import { plugins } from './loader'
import { getSettingsStore } from '../store'

const settingsStore = getSettingsStore()
const customTitlebar = !settingsStore.get('useNativeTitlebar')

export const PLUGIN_PARTITION = 'persist:plugin'

export const pluginViews: types.PlainObj<{
  view: WebContentsView
  win: BrowserWindow
}> = {}

let preloadPluginView: WebContentsView | null = null

function createPluginView() {
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../preload/plugin.js'),
      partition: PLUGIN_PARTITION,
      webSecurity: false,
      sandbox: false,
      webviewTag: true,
    },
  })
  view.webContents.loadURL('about:blank')
  return view
}

function getPluginView() {
  if (preloadPluginView) {
    const view = preloadPluginView
    preloadPluginView = null
    return view
  }

  return createPluginView()
}

function getWebPluginView() {
  return new WebContentsView({
    webPreferences: {
      partition: PLUGIN_PARTITION,
    },
  })
}

export const openPlugin: IpcOpenPlugin = function (id, detached) {
  const plugin = plugins[id]
  if (!plugin) {
    return false
  }

  if (pluginViews[id]) {
    const { win } = pluginViews[id]
    win.show()
    win.focus()
    return false
  }

  const pluginView = plugin.online ? getWebPluginView() : getPluginView()
  pluginView.webContents.on('page-title-updated', (_e, title) => {
    const { win } = pluginViews[id]
    if (win) {
      win.webContents.send('updatePluginTitle', title)
    }
  })

  const mainWin = window.getWin('main')
  if (detached || !mainWin) {
    const newWin = pluginWin.showWin(plugin)
    pluginViews[id] = { view: pluginView, win: newWin }
    updatePluginTheme(id)
    newWin.contentView.addChildView(pluginView)
    layoutPlugin(id)
  } else {
    pluginViews[id] = { view: pluginView, win: mainWin }
    updatePluginTheme(id)
    mainWin.contentView.addChildView(pluginView)
    layoutPlugin(id)
  }

  if (startWith(plugin.main, 'http')) {
    pluginView.webContents.loadURL(plugin.main)
  } else {
    let entry = path.basename(plugin.main)
    if (plugin.historyApiFallback) {
      entry = entry.replace('index.html', '')
    }
    pluginView.webContents.loadURL(`plugin://${id}/${entry}`)
  }

  return true
}

export const reopenPlugin: IpcReopenPlugin = async function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  await view.webContents.reload()
}

theme.on('change', () => {
  each(pluginViews, (_, id) => {
    updatePluginTheme(id)
  })
})

export function updatePluginTheme(id: string) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('changeTheme')
  view.setBackgroundColor(
    theme.get() === 'dark' ? colorBgContainerDark : colorBgContainer
  )
}

export const closePlugin: IpcClosePlugin = async function (id) {
  const { view, win } = pluginViews[id]
  if (!view) {
    return
  }

  win.contentView.removeChildView(view)
  view.webContents.close()
  delete pluginViews[id]
}

export const detachPlugin: IpcDetachPlugin = async function (id) {
  const { view, win } = pluginViews[id]
  if (!view) {
    return
  }

  const plugin = getAttachedPlugin(win)
  if (!plugin) {
    return
  }
  win.contentView.removeChildView(view)
  const newWin = pluginWin.showWin(plugin)
  newWin.on('ready-to-show', () => {
    const title = view.webContents.getTitle()
    newWin.webContents.send('updatePluginTitle', title)
  })
  newWin.contentView.addChildView(view)
  pluginViews[id].win = newWin
  layoutPlugin(id)
}

export function getAttachedPlugin(win: BrowserWindow): IPlugin | undefined {
  for (const id in pluginViews) {
    if (pluginViews[id].win === win) {
      return plugins[id]
    }
  }
}

export function layoutPlugin(id: string) {
  const { view, win } = pluginViews[id]

  let titleBarHeight = 50
  if (win !== window.getWin('main')) {
    titleBarHeight = 0
    if (customTitlebar) {
      titleBarHeight = 31
      if (isMac) {
        titleBarHeight = 28
      }
    }
  }
  if (win.isFullScreen()) {
    titleBarHeight = 0
  }
  const bounds = win.contentView.getBounds()
  view.setBounds({
    x: bounds.x,
    y: bounds.y + titleBarHeight,
    width: bounds.width,
    height: bounds.height - titleBarHeight,
  })
}

export const togglePluginDevtools: IpcTogglePluginDevtools = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  if (view.webContents.isDevToolsOpened()) {
    view.webContents.closeDevTools()
  } else {
    view.webContents.openDevTools({ mode: 'detach' })
  }
}

export const showPluginContextMenu: IpcShowPluginContextMenu = function (
  x,
  y,
  options
) {
  const plugin = getAttachedPlugin(window.getFocusedWin()!)
  if (plugin) {
    const { view } = pluginViews[plugin.id]

    const bounds = view.getBounds()
    x += bounds.x
    y += bounds.y

    contextMenu(view, x, y, options)
  }
}

export const exportPluginData: IpcExportPluginData = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('exportData')
}

export const importPluginData: IpcImportPluginData = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('importData')
}

export const clearPluginData: IpcClearPluginData = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('clearData')
}

export function preparePluginView() {
  if (!preloadPluginView) {
    preloadPluginView = createPluginView()
  }
}
