import {
  IpcCallMcpTool,
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcClearPluginData,
  IpcExportPluginData,
  IpcImportPluginData,
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
import debounce from 'licia/debounce'
import waitUntil from 'licia/waitUntil'
import { BrowserWindow, WebContents, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import * as pluginWin from '../../window/plugin'
import isMac from 'licia/isMac'
import isEmpty from 'licia/isEmpty'
import contextMenu from '../contextMenu'
import { plugins, getPlugins, hasPlugin } from './loader'
import { getSettingsStore, getMainStore } from '../store'
import {
  InspectAddress,
  startPluginInspect,
  stopPluginInspect,
} from './inspect'
import { disposePluginHttpSession } from '../http'
import { callExternalMcpTool, validateMcpToolArgs } from '../mcp'

const settingsStore = getSettingsStore()
const customTitlebar = !settingsStore.get('useNativeTitlebar')

export const PLUGIN_PARTITION = 'persist:plugin'

export const pluginViews: types.PlainObj<{
  view: WebContentsView
  win: BrowserWindow | null
  childWindows: Set<BrowserWindow>
}> = {}

let preloadPluginView: WebContentsView | null = null

function setPluginView(
  id: string,
  view: WebContentsView,
  win: BrowserWindow | null
) {
  pluginViews[id] = { view, win, childWindows: new Set() }
}

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

function getPluginViewEntry(webContents: WebContents) {
  for (const id in pluginViews) {
    const entry = pluginViews[id]
    if (entry.view.webContents === webContents) {
      return entry
    }
  }
}

function focusChildWindow(childWindows: Set<BrowserWindow>, url: string) {
  for (const childWin of childWindows) {
    if (childWin.webContents.getURL() !== url) continue

    if (childWin.isMinimized()) {
      childWin.restore()
    }
    childWin.show()
    childWin.focus()
    return true
  }

  return false
}

function setupWindowOpenHandler(webContents: WebContents) {
  webContents.setWindowOpenHandler(({ url, features }) => {
    const entry = getPluginViewEntry(webContents)
    if (entry && focusChildWindow(entry.childWindows, url)) {
      return { action: 'deny' }
    }

    const opts = parseOpenWindowFeatures(features)
    if (entry && startWith(url, 'plugin:')) {
      opts.webPreferences = {
        ...opts.webPreferences,
        preload: path.join(__dirname, '../preload/plugin.js'),
        partition: PLUGIN_PARTITION,
        webSecurity: false,
        sandbox: false,
      }
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: opts,
    }
  })

  webContents.on('did-create-window', (childWin, details) => {
    const entry = getPluginViewEntry(webContents)
    if (entry && startWith(details.url, 'plugin:')) {
      entry.childWindows.add(childWin)
      childWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      childWin.on('closed', () => {
        entry.childWindows.delete(childWin)
      })
    } else if (details.url === 'about:blank') {
      childWin.on('close', () => {
        childWin.hide()
      })
    }
  })

  webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') {
      return
    }

    if (input.key === 'Escape') {
      const win = BrowserWindow.fromWebContents(webContents)
      if (win === window.getWin('main')) {
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
  setupWindowOpenHandler(view.webContents)
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
  setupWindowOpenHandler(view.webContents)
  return view
}

function getPluginStates() {
  return getMainStore().get('pluginStates') || {}
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
      notifyRunningPluginsChanged()
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

  if (background) {
    setPluginView(id, pluginView, null)
    updatePluginTheme(id)
  } else {
    const mainWin = window.getWin('main')
    if (detached || !mainWin) {
      const newWin = pluginWin.showWin(plugin)
      setPluginView(id, pluginView, newWin)
      updatePluginTheme(id)
      newWin.contentView.addChildView(pluginView)
      layoutPlugin(id)
    } else {
      setPluginView(id, pluginView, mainWin)
      updatePluginTheme(id)
      mainWin.contentView.addChildView(pluginView)
      layoutPlugin(id)
    }
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
  const backgroundColor =
    theme.get() === 'dark' ? colorBgContainerDark : colorBgContainer
  view.setBackgroundColor(backgroundColor)
  pluginViews[id].childWindows.forEach((childWin) => {
    childWin.webContents.send('changeTheme')
    childWin.setBackgroundColor(backgroundColor)
  })
}

export const closePlugin: IpcClosePlugin = async function (id, destroy) {
  const { view, win } = pluginViews[id]
  if (!view) {
    return
  }

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
      pluginViews[id].win = null
      if (isMainWin) {
        window.sendTo('main', 'pluginClosed', id)
      }
      return
    }
  }

  stopPluginInspect(id)
  disposePluginHttpSession(id)
  for (const childWin of [...pluginViews[id].childWindows]) {
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

export async function callPluginMcpTool(
  id: string,
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  if (!id || !name) {
    throw new Error('Missing plugin id or tool name')
  }
  if (!isPluginRunning(id)) {
    throw new Error(
      `Plugin is not running. Please start it first: tinker open ${id}`
    )
  }

  await getPlugins()
  if (!hasPlugin(id)) {
    throw new Error(`Plugin not found: ${id}`)
  }

  const plugin = plugins[id]
  const tools = plugin.mcp?.tools
  if (!tools || !tools[name]) {
    throw new Error(`Unknown tool "${name}"`)
  }

  const validationError = validateMcpToolArgs(
    `${id}:${name}`,
    tools[name].inputSchema,
    args
  )
  if (validationError) {
    throw new Error(validationError)
  }

  const { view } = pluginViews[id]
  const script = `(async function() {
    if (!window.mcp || typeof window.mcp.callTool !== 'function') {
      return null;
    }
    try {
      return await window.mcp.callTool(${JSON.stringify(
        name
      )}, ${JSON.stringify(args)});
    } catch (e) {
      return 'Error: ' + (e.message || String(e));
    }
  })()`

  try {
    const { result } = await waitUntil(
      async () => {
        const result = await view.webContents.executeJavaScript(script, true)
        return result === null ? false : { result: result as string }
      },
      5000,
      100
    )
    return result
  } catch {
    throw new Error(
      'Plugin MCP API is not ready. Please wait for the plugin to finish loading.'
    )
  }
}

export const callMcpTool: IpcCallMcpTool = async function (
  target,
  name,
  args = {}
) {
  if (typeof target === 'string') {
    return callPluginMcpTool(target, name, args)
  }
  return callExternalMcpTool(target, name, args)
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

export function getWebContentsPlugin(
  webContents: WebContents
): IPlugin | undefined {
  for (const id in pluginViews) {
    const entry = pluginViews[id]
    if (entry.view.webContents === webContents) {
      return plugins[id]
    }
    for (const childWin of entry.childWindows) {
      if (childWin.webContents === webContents) {
        return plugins[id]
      }
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
  const { width, height } = win.getBounds()
  view.setBounds({
    x: 0,
    y: titleBarHeight,
    width,
    height: height - titleBarHeight,
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

export function showPluginContextMenu(
  webContents: WebContents,
  x: number,
  y: number,
  options: Parameters<IpcShowPluginContextMenu>[2]
) {
  const plugin = getWebContentsPlugin(webContents)
  if (!plugin) {
    return
  }

  const { view, win } = pluginViews[plugin.id]
  const focused = BrowserWindow.fromWebContents(webContents)

  if (webContents !== view.webContents) {
    contextMenu(webContents, x, y, options, focused)
    return
  }

  const bounds = view.getBounds()
  x += bounds.x
  y += bounds.y

  contextMenu(webContents, x, y, options, win)
}

export const exportPluginData: IpcExportPluginData = function (id) {
  evalPluginRendererMenu(id, 'exportData', id)
}

export const importPluginData: IpcImportPluginData = function (id) {
  evalPluginRendererMenu(id, 'importData')
}

export const clearPluginData: IpcClearPluginData = function (id) {
  evalPluginRendererMenu(id, 'clearData')
}

type PluginRendererFn =
  | 'importData'
  | 'exportData'
  | 'clearData'
  | 'showRecordingCursor'
  | 'hideRecordingCursor'
  | 'moveRecordingCursorTo'

function evalPluginRendererMenu(
  id: string,
  fn: PluginRendererFn,
  ...args: unknown[]
) {
  void evalPluginRenderer(id, fn, ...args).catch(() => {})
}

export async function evalPluginRenderer(
  id: string,
  fn: PluginRendererFn,
  ...args: unknown[]
) {
  const { view } = pluginViews[id] || {}
  if (!view) {
    throw new Error(`Plugin is not running: ${id}`)
  }

  try {
    await waitUntil(
      async () => {
        const ready = await view.webContents.executeJavaScript(
          'typeof _tinkerRenderer !== "undefined"',
          true
        )
        return !!ready
      },
      5000,
      100
    )
  } catch {
    throw new Error(
      'Plugin renderer is not ready. Please wait for the plugin to finish loading.'
    )
  }

  const call = `_tinkerRenderer.${fn}(${args
    .map((arg) => JSON.stringify(arg))
    .join(', ')})`
  const result = await view.webContents.executeJavaScript(
    `(async () => {
      try {
        return await ${call}
      } catch (e) {
        return { error: e.message || String(e) }
      }
    })()`,
    true
  )

  if (
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    'error' in result
  ) {
    throw new Error(String((result as { error: unknown }).error))
  }

  return result
}

export function preparePluginView() {
  if (!preloadPluginView) {
    preloadPluginView = createPluginView()
  }
}
