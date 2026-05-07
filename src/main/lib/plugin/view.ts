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
import contain from 'licia/contain'
import trim from 'licia/trim'
import toNum from 'licia/toNum'
import { BrowserWindow, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import * as pluginWin from '../../window/plugin'
import isMac from 'licia/isMac'
import contextMenu from '../contextMenu'
import { plugins } from './loader'
import { getSettingsStore, getMainStore } from '../store'

const settingsStore = getSettingsStore()
const customTitlebar = !settingsStore.get('useNativeTitlebar')

export const PLUGIN_PARTITION = 'persist:plugin'

export const pluginViews: types.PlainObj<{
  view: WebContentsView
  win: BrowserWindow | null
}> = {}

let preloadPluginView: WebContentsView | null = null

const allowedWindowOptions = [
  'minWidth',
  'minHeight',
  'alwaysOnTop',
  'resizable',
]

const allowedWebPreferences = ['webviewTag']

function parseOpenWindowFeatures(features: string) {
  const opts: Record<string, any> = {}
  if (!features) return opts

  const webPreferences: Record<string, any> = {}

  each(features.split(','), (part: string) => {
    const [key, val] = part.split('=').map((s) => trim(s))
    if (val === undefined) return

    if (contain(allowedWebPreferences, key)) {
      if (val === 'true' || val === 'yes') {
        webPreferences[key] = true
      }
      return
    }

    if (!contain(allowedWindowOptions, key)) return

    if (val === 'true' || val === 'yes') {
      opts[key] = true
    } else if (val === 'false' || val === 'no') {
      opts[key] = false
    } else {
      const num = toNum(val)
      if (!isNaN(num)) {
        opts[key] = num
      }
    }
  })

  if (Object.keys(webPreferences).length > 0) {
    opts.webPreferences = webPreferences
  }

  return opts
}

function setupWindowOpenHandler(view: WebContentsView) {
  view.webContents.setWindowOpenHandler(({ features }) => {
    const opts = parseOpenWindowFeatures(features)

    return {
      action: 'allow',
      overrideBrowserWindowOptions: opts,
    }
  })

  view.webContents.on('did-create-window', (childWin) => {
    childWin.on('close', () => {
      childWin.hide()
    })
  })

  // Forward ESC key presses to the main window so plugin views can be closed via keyboard
  view.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') {
      return
    }

    if (input.key === 'Escape') {
      const mainWin = window.getWin('main')
      if (mainWin) {
        window.sendTo('main', 'pressEsc')
      }
    }
  })
}

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
  setupWindowOpenHandler(view)
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
  const view = new WebContentsView({
    webPreferences: {
      partition: PLUGIN_PARTITION,
    },
  })
  setupWindowOpenHandler(view)
  return view
}

export const openPlugin: IpcOpenPlugin = function (id, detached) {
  const plugin = plugins[id]
  if (!plugin) {
    return false
  }

  if (pluginViews[id]) {
    const { view, win } = pluginViews[id]
    // Backgrounded plugin: reattach the existing view
    if (!win) {
      const title = view.webContents.getTitle()
      const mainWin = window.getWin('main')
      const targetWin =
        detached || !mainWin ? pluginWin.showWin(plugin) : mainWin
      pluginViews[id].win = targetWin
      updatePluginTheme(id)
      targetWin.contentView.addChildView(view)
      layoutPlugin(id)
      setTimeout(
        () => targetWin.webContents.send('updatePluginTitle', title),
        100
      )
      return true
    }
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

export const closePlugin: IpcClosePlugin = async function (id, destroy) {
  const { view, win } = pluginViews[id]
  if (!view) {
    return
  }

  if (win) {
    win.contentView.removeChildView(view)
    // Restore focus to the main window after removing the plugin view
    if (win === window.getWin('main')) {
      win.webContents.focus()
    }
  }

  if (!destroy) {
    const mainStore = getMainStore()
    const pluginStates = mainStore.get('pluginStates') || {}
    if (pluginStates[id]?.runInBackground) {
      pluginViews[id].win = null
      return
    }
  }

  view.webContents.close()
  delete pluginViews[id]

  // Close the detached window if it's not the main window
  if (win && win !== window.getWin('main')) {
    win.close()
  }
}

export function isPluginRunning(id: string, backgroundOnly?: boolean) {
  const entry = pluginViews[id]
  if (!entry) {
    return false
  }
  return backgroundOnly ? !entry.win : true
}

export const detachPlugin: IpcDetachPlugin = async function (id) {
  const { view, win } = pluginViews[id]
  if (!view || !win) {
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
    if (pluginViews[id].win && pluginViews[id].win === win) {
      return plugins[id]
    }
  }
}

export function layoutPlugin(id: string) {
  const { view, win } = pluginViews[id]
  if (!win) {
    return
  }

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
