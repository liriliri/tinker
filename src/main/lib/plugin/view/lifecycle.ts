import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcReopenPlugin,
  IPlugin,
} from 'common/types'
import path from 'path'
import startWith from 'licia/startWith'
import each from 'licia/each'
import debounce from 'licia/debounce'
import isMac from 'licia/isMac'
import isEmpty from 'licia/isEmpty'
import { BrowserWindow, WebContents, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import * as pluginWin from '../../../window/plugin'
import { plugins, getPlugins } from '../loader'
import { getSettingsStore, getMainStore } from '../../store'
import {
  InspectAddress,
  startPluginInspect,
  stopPluginInspect,
} from '../inspect'
import { disposePluginHttpSession } from '../../http'
import { findPluginByWebContents, pluginViews, setPluginView } from './state'
import { getPluginView, getWebPluginView } from './create'
import { applyViewTheme, applyWindowTheme } from './util'

const settingsStore = getSettingsStore()
const customTitlebar = !settingsStore.get('useNativeTitlebar')

function getPluginStates() {
  return getMainStore().get('pluginStates') || {}
}

function attachViewToWindow(
  id: string,
  view: WebContentsView,
  win: BrowserWindow
) {
  if (pluginViews[id]) {
    pluginViews[id].win = win
  } else {
    setPluginView(id, view, win)
  }
  updatePluginTheme(id)
  win.contentView.addChildView(view)
  layoutPlugin(id)
}

function resolveTargetWindow(plugin: IPlugin, detached?: boolean) {
  const mainWin = window.getWin('main')
  return detached || !mainWin ? pluginWin.showWin(plugin) : mainWin
}

export function openPlugin(
  id: string,
  detached?: boolean,
  background?: boolean
) {
  const plugin = plugins[id]
  if (!plugin) {
    return false
  }

  if (background) {
    const pluginStates = getPluginStates()
    if (!pluginStates[id]?.runInBackground) {
      throw new Error(`Plugin does not allow running in background: ${id}`)
    }
  }

  if (pluginViews[id]) {
    if (background) {
      return false
    }
    const { view, win } = pluginViews[id]
    // Backgrounded plugin: reattach the existing view
    if (!win) {
      const title = view.webContents.getTitle()
      const targetWin = resolveTargetWindow(plugin, detached)
      attachViewToWindow(id, view, targetWin)
      setTimeout(
        () => targetWin.webContents.send('updatePluginTitle', title),
        100
      )
      notifyRunningPluginsChanged()
      return true
    }
    win.show()
    win.focus()
    return false
  }

  const pluginView = plugin.online ? getWebPluginView() : getPluginView()
  pluginView.webContents.on('page-title-updated', (_e, title) => {
    const { win } = pluginViews[id] || {}
    if (win) {
      win.webContents.send('updatePluginTitle', title)
    }
  })

  if (background) {
    setPluginView(id, pluginView, null)
    updatePluginTheme(id)
  } else {
    attachViewToWindow(id, pluginView, resolveTargetWindow(plugin, detached))
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

  notifyRunningPluginsChanged()
  return true
}

export async function startBackgroundPlugins() {
  const pluginStates = getPluginStates()
  const ids = Object.keys(pluginStates).filter(
    (id) => pluginStates[id]?.runAtStartup && pluginStates[id]?.runInBackground
  )
  if (isEmpty(ids)) {
    return
  }

  await getPlugins()
  for (const id of ids) {
    openPlugin(id, false, true)
  }
}

export const reopenPlugin: IpcReopenPlugin = async function (id) {
  const entry = pluginViews[id]
  if (!entry?.view) {
    return
  }

  await entry.view.webContents.reload()
}

theme.on('change', () => {
  each(pluginViews, (_, id) => {
    updatePluginTheme(id)
  })
})

export function updatePluginTheme(id: string) {
  const entry = pluginViews[id]
  if (!entry?.view) {
    return
  }

  applyViewTheme(entry.view)
  entry.childWindows.forEach((childWin) => {
    applyWindowTheme(childWin)
  })
}

export const closePlugin: IpcClosePlugin = async function (id, destroy) {
  const entry = pluginViews[id]
  if (!entry?.view) {
    return
  }
  const { view, win } = entry

  const isMainWin = win === window.getWin('main')

  if (win) {
    win.contentView.removeChildView(view)
    if (isMainWin) {
      win.webContents.focus()
    }
  }

  if (!destroy) {
    const pluginStates = getPluginStates()
    if (pluginStates[id]?.runInBackground) {
      entry.win = null
      if (isMainWin) {
        window.sendTo('main', 'pluginClosed', id)
      }
      return
    }
  }

  stopPluginInspect(id)
  disposePluginHttpSession(id)
  for (const childWin of [...entry.childWindows]) {
    childWin.close()
  }
  view.webContents.close()
  delete pluginViews[id]

  if (win && !isMainWin) {
    win.close()
  } else if (isMainWin) {
    window.sendTo('main', 'pluginClosed', id)
  }
  notifyRunningPluginsChanged()
}

export function getRunningPlugins() {
  return Object.keys(pluginViews).map((id) => ({
    id,
    background: !pluginViews[id].win,
  }))
}

export async function startPluginInspectForRunning(
  pluginId: string,
  address?: InspectAddress
): Promise<string> {
  const entry = pluginViews[pluginId]
  if (!entry) {
    throw new Error(`Plugin is not running: ${pluginId}`)
  }
  const plugin = plugins[pluginId]
  return startPluginInspect(pluginId, entry.view.webContents, {
    address,
    title: plugin?.name || pluginId,
    pageUrl: entry.view.webContents.getURL() || `plugin://${pluginId}/`,
  })
}

const notifyRunningPluginsChanged = debounce(function () {
  window.sendTo('main', 'runningPluginsChanged', getRunningPlugins())
}, 1000)

export function isPluginRunning(id: string, backgroundOnly?: boolean) {
  const entry = pluginViews[id]
  if (!entry) {
    return false
  }
  return backgroundOnly ? !entry.win : true
}

export const detachPlugin: IpcDetachPlugin = async function (id) {
  const entry = pluginViews[id]
  if (!entry?.view || !entry.win) {
    return
  }
  const plugin = plugins[id]
  if (!plugin) {
    return
  }

  const { view, win } = entry
  win.contentView.removeChildView(view)
  const newWin = pluginWin.showWin(plugin)
  newWin.on('ready-to-show', () => {
    const title = view.webContents.getTitle()
    newWin.webContents.send('updatePluginTitle', title)
  })
  attachViewToWindow(id, view, newWin)
}

export function getAttachedPlugin(win: BrowserWindow): IPlugin | undefined {
  for (const id in pluginViews) {
    if (pluginViews[id].win === win) {
      return plugins[id]
    }
  }
}

export function getWebContentsPlugin(
  webContents: WebContents
): IPlugin | undefined {
  const found = findPluginByWebContents(webContents)
  return found ? plugins[found.id] : undefined
}

export function layoutPlugin(id: string) {
  const entry = pluginViews[id]
  if (!entry?.win) {
    return
  }
  const { view, win } = entry

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
  const { width, height } = win.getBounds()
  view.setBounds({
    x: 0,
    y: titleBarHeight,
    width,
    height: height - titleBarHeight,
  })
}
