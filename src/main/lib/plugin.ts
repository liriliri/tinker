import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcExportPluginData,
  IpcGetPlugins,
  IpcImportPluginData,
  IpcOpenPlugin,
  IpcReopenPlugin,
  IpcShowPluginContextMenu,
  IpcTogglePluginDevtools,
  IPlugin,
  IRawPlugin,
} from 'common/types'
import { handleEvent, resolveResources } from 'share/main/lib/util'
import singleton from 'licia/singleton'
import { isDev } from 'share/common/util'
import path from 'path'
import fs from 'fs-extra'
import startWith from 'licia/startWith'
import * as language from 'share/main/lib/language'
import extend from 'licia/extend'
import types from 'licia/types'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import identity from 'licia/identity'
import { BrowserWindow, ipcMain, session, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import each from 'licia/each'
import * as pluginWin from '../window/plugin'
import isMac from 'licia/isMac'
import replaceAll from 'licia/replaceAll'
import contextMenu from './contextMenu'
import { exec } from 'child_process'
import log from 'share/common/log'
import mime from 'mime'
import { getClipboardFilePaths } from './clipboard'
import { getSettingsStore } from './store'

const logger = log('plugin')

const settingsStore = getSettingsStore()
const customTitlebar = !settingsStore.get('useNativeTitlebar')

const plugins: types.PlainObj<IPlugin> = {}

const PLUGIN_PARTITION = 'persist:plugin'
const DEFAULT_ICON = resolveResources('default-plugin.png')

const getPlugins: IpcGetPlugins = singleton(async (force = false) => {
  if (!force && !isEmpty(plugins)) {
    return map(plugins, identity)
  }

  const pluginDirs: Array<{ dir: string; prefix?: string }> = []
  if (isEmpty(plugins)) {
    pluginDirs.push({ dir: getBuiltinPluginDir() })
  }
  try {
    const npmGlobalDir = await getNpmGlobalDir()
    pluginDirs.push({ dir: npmGlobalDir })
    const files = await fs.readdir(npmGlobalDir, { withFileTypes: true })
    for (const file of files) {
      if (startWith(file.name, '@') && file.isDirectory()) {
        pluginDirs.push({
          dir: path.join(npmGlobalDir, file.name),
          prefix: file.name + '/',
        })
      }
    }
  } catch (e) {
    logger.warn('failed to get npm global directory:', e)
  }

  each(plugins, (plugin) => {
    if (!plugin.builtin) {
      delete plugins[plugin.id]
    }
  })

  logger.info('loading plugins from directories:', pluginDirs)
  for (const { dir, prefix = '' } of pluginDirs) {
    const files = await fs.readdir(dir, { withFileTypes: true })
    for (const file of files) {
      if (startWith(file.name, 'tinker-')) {
        let isDir = file.isDirectory()
        if (file.isSymbolicLink()) {
          const fullPath = path.join(dir, file.name)
          try {
            const stat = await fs.stat(fullPath)
            isDir = stat.isDirectory()
          } catch (e) {
            logger.error(`failed to stat symlink ${file.name}:`, e)
            continue
          }
        }
        if (isDir) {
          try {
            const pluginId = normalizePluginId(prefix + file.name)
            if (!plugins[pluginId]) {
              plugins[pluginId] = await loadPlugin(
                pluginId,
                path.join(dir, file.name)
              )
            } else {
              logger.warn(`plugin conflict: ${pluginId}`)
            }
          } catch (e) {
            logger.error(`failed to load plugin ${file.name}:`, e)
          }
        }
      }
    }
  }

  return map(plugins, identity)
})

function normalizePluginId(id: string) {
  if (startWith(id, '@')) {
    return replaceAll(id.slice(1), '/', '-')
  }

  return id
}

function getBuiltinPluginDir() {
  return path.join(__dirname, isDev() ? '../../plugins' : '../plugins')
}

async function getNpmGlobalDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('npm root -g', (error: Error | null, stdout: string) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function loadPlugin(id: string, dir: string): Promise<IPlugin> {
  const builtinDir = getBuiltinPluginDir()
  const pkgPath = path.join(dir, 'package.json')
  const pkg = await fs.readJson(pkgPath)
  const rawPlugin = pkg.tinker as IRawPlugin
  const plugin: IPlugin = {
    id,
    dir,
    root: path.join(dir, path.dirname(rawPlugin.main)),
    name: rawPlugin.name,
    icon: rawPlugin.icon || '',
    main: rawPlugin.main,
    historyApiFallback: rawPlugin.historyApiFallback || false,
    preload: rawPlugin.preload,
    online: startWith(rawPlugin.main, 'https://'),
    builtin: startWith(dir, builtinDir),
  }
  if (plugin.icon) {
    plugin.icon = path.join(dir, plugin.icon)
  } else {
    plugin.icon = DEFAULT_ICON
  }
  if (plugin.preload) {
    plugin.preload = path.join(dir, plugin.preload)
  }
  const lang = language.get()
  if (rawPlugin.locales) {
    const locale = rawPlugin.locales[lang]
    if (locale) {
      extend(plugin, locale)
    }
  }

  return plugin
}

const pluginViews: types.PlainObj<{
  view: WebContentsView
  win: BrowserWindow
}> = {}

let preloadPluginView: WebContentsView | null = null
function createPluginView() {
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../preload/plugin.js'),
      partition: PLUGIN_PARTITION,
      sandbox: false,
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

const openPlugin: IpcOpenPlugin = function (id, detached) {
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

  const win = window.getWin('main')

  const pluginView = plugin.online ? getWebPluginView() : getPluginView()
  pluginViews[id] = {
    view: pluginView,
    win,
  }
  pluginView.webContents.on('page-title-updated', (e, title) => {
    const { win } = pluginViews[id]
    if (win) {
      win.webContents.send('updatePluginTitle', title)
    }
  })
  updatePluginTheme(id)

  if (detached) {
    detachPlugin(id)
  } else {
    win.contentView.addChildView(pluginView)
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

const reopenPlugin: IpcReopenPlugin = async function (id) {
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

function updatePluginTheme(id: string) {
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

export function getAttachedPlugin(win: BrowserWindow) {
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
  const bounds = win.contentView.getBounds()
  view.setBounds({
    x: bounds.x,
    y: bounds.y + titleBarHeight,
    width: bounds.width,
    height: bounds.height - titleBarHeight,
  })
}

const togglePluginDevtools: IpcTogglePluginDevtools = function (id) {
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

const showPluginContextMenu: IpcShowPluginContextMenu = function (
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

const exportPluginData: IpcExportPluginData = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('exportData')
}

const importPluginData: IpcImportPluginData = function (id) {
  const { view } = pluginViews[id]
  if (!view) {
    return
  }

  view.webContents.send('importData')
}

function preparePluginView() {
  if (!preloadPluginView) {
    preloadPluginView = createPluginView()
  }
}

function nodeStreamToWeb(
  stream: NodeJS.ReadableStream
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)))
      stream.on('end', () => controller.close())
      stream.on('error', (err) => controller.error(err))
    },
    cancel() {
      if (typeof (stream as any).destroy === 'function') {
        ;(stream as any).destroy()
      }
    },
  })
}

export function init() {
  handleEvent('getPlugins', getPlugins)
  handleEvent('openPlugin', openPlugin)
  handleEvent('reopenPlugin', reopenPlugin)
  handleEvent('closePlugin', closePlugin)
  handleEvent('detachPlugin', detachPlugin)
  handleEvent('togglePluginDevtools', togglePluginDevtools)
  handleEvent('showPluginContextMenu', showPluginContextMenu)
  handleEvent('getClipboardFilePaths', getClipboardFilePaths)
  handleEvent('exportPluginData', exportPluginData)
  handleEvent('importPluginData', importPluginData)
  handleEvent('preparePluginView', preparePluginView)
  ipcMain.handle('getAttachedPlugin', (event) => {
    for (const id in pluginViews) {
      if (pluginViews[id].view.webContents === event.sender) {
        return plugins[id]
      }
    }
  })

  const pluginSession = session.fromPartition(PLUGIN_PARTITION)
  pluginSession.protocol.handle('plugin', async (request) => {
    const urlObj = new URL(request.url)
    const pluginId = urlObj.host
    let pathname = urlObj.pathname

    const prefix = `/plugin://${pluginId}/`
    if (pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length - 1)
    }

    let filePath = ''
    if (startWith(pathname, '/vendor/')) {
      filePath = path.join(
        getBuiltinPluginDir(),
        'vendor/dist',
        urlObj.pathname.replace('/vendor/', '')
      )
      if (!(await fs.pathExists(filePath))) {
        return new Response('Not Found', { status: 404 })
      }
    } else {
      const plugin = plugins[pluginId]

      filePath = path.join(plugin.root, pathname)
      if (await fs.pathExists(filePath)) {
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html')
        }
      } else if (plugin.historyApiFallback) {
        filePath = path.join(plugin.root, 'index.html')
      }

      if (!(await fs.pathExists(filePath))) {
        return new Response('Not Found', { status: 404 })
      }
    }

    const type = mime.getType(filePath) || 'application/octet-stream'
    const nodeStream = fs.createReadStream(filePath)
    const webStream = nodeStreamToWeb(nodeStream)

    return new Response(webStream, {
      headers: { 'Content-Type': type },
    })
  })
}
