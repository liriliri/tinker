import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcGetPlugins,
  IpcOpenPlugin,
  IPlugin,
  IRawPlugin,
} from 'common/types'
import { handleEvent } from 'share/main/lib/util'
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
import { BrowserWindow, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import * as theme from 'share/main/lib/theme'
import { colorBgContainer, colorBgContainerDark } from 'common/theme'
import each from 'licia/each'
import * as pluginWin from '../window/plugin'
import isMac from 'licia/isMac'

const plugins: types.PlainObj<IPlugin> = {}

const getPlugins: IpcGetPlugins = singleton(async () => {
  if (isEmpty(plugins)) {
    const pluginDir = path.join(
      __dirname,
      isDev() ? '../../plugins' : '../plugins'
    )
    const files = await fs.readdir(pluginDir, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory() && startWith(file.name, 'tinker-')) {
        try {
          plugins[file.name] = await loadPlugin(path.join(pluginDir, file.name))
        } catch {
          // ignore
        }
      }
    }
  }

  return map(plugins, identity)
})

async function loadPlugin(dir: string): Promise<IPlugin> {
  const pkgPath = path.join(dir, 'package.json')
  const pkg = await fs.readJson(pkgPath)
  const rawPlugin = pkg.tinker as IRawPlugin
  const plugin: IPlugin = {
    id: pkg.name,
    name: rawPlugin.name,
    description: rawPlugin.description,
    icon: rawPlugin.icon,
    main: rawPlugin.main,
    preload: rawPlugin.preload,
  }
  plugin.icon = path.join(dir, plugin.icon)
  plugin.main = path.join(dir, plugin.main)
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

const openPlugin: IpcOpenPlugin = async function (id) {
  const plugin = plugins[id]
  if (!plugin) {
    return false
  }

  if (pluginViews[id]) {
    pluginViews[id].win.focus()
    return false
  }

  const win = window.getWin('main')

  const pluginView = new WebContentsView({
    webPreferences: {
      preload: plugin.preload,
    },
  })
  pluginViews[id] = {
    view: pluginView,
    win,
  }
  updatePluginTheme(id)
  await pluginView.webContents.loadFile(plugin.main)

  win.contentView.addChildView(pluginView)
  layoutPlugin(id)

  return true
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
  const bounds = win.contentView.getBounds()
  if (win !== window.getWin('main')) {
    titleBarHeight = 31
    if (isMac) {
      titleBarHeight = 28
    }
  }
  view.setBounds({
    x: bounds.x,
    y: bounds.y + titleBarHeight,
    width: bounds.width,
    height: bounds.height - titleBarHeight,
  })
}

export function init() {
  handleEvent('getPlugins', getPlugins)
  handleEvent('openPlugin', openPlugin)
  handleEvent('closePlugin', closePlugin)
  handleEvent('detachPlugin', detachPlugin)
}
