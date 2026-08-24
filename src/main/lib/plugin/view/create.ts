import path from 'path'
import startWith from 'licia/startWith'
import each from 'licia/each'
import contain from 'licia/contain'
import trim from 'licia/trim'
import toNum from 'licia/toNum'
import { BrowserWindow, WebContents, WebContentsView } from 'electron'
import * as window from 'share/main/lib/window'
import { PLUGIN_PARTITION, findPluginByWebContents } from './state'

let preloadPluginView: WebContentsView | null = null

const pluginPreloadPath = path.join(__dirname, '../preload/plugin.js')

function getPluginWebPreferences(
  extras?: Record<string, unknown>
): Record<string, unknown> {
  return {
    preload: pluginPreloadPath,
    partition: PLUGIN_PARTITION,
    webSecurity: false,
    sandbox: false,
    ...extras,
  }
}

const allowedWindowOptions = [
  'minWidth',
  'minHeight',
  'alwaysOnTop',
  'resizable',
]

const allowedWebPreferences = ['webviewTag']

function parseFeatureValue(val: string) {
  if (val === 'true' || val === 'yes') return true
  if (val === 'false' || val === 'no') return false
  const num = toNum(val)
  return isNaN(num) ? undefined : num
}

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

    const parsed = parseFeatureValue(val)
    if (parsed !== undefined) {
      opts[key] = parsed
    }
  })

  if (Object.keys(webPreferences).length > 0) {
    opts.webPreferences = webPreferences
  }

  return opts
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
    const entry = findPluginByWebContents(webContents)?.entry
    if (entry && focusChildWindow(entry.childWindows, url)) {
      return { action: 'deny' }
    }

    const opts = parseOpenWindowFeatures(features)
    if (entry && startWith(url, 'plugin:')) {
      opts.webPreferences = {
        ...opts.webPreferences,
        ...getPluginWebPreferences(),
      }
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: opts,
    }
  })

  webContents.on('did-create-window', (childWin, details) => {
    const entry = findPluginByWebContents(webContents)?.entry
    if (entry && startWith(details.url, 'plugin:')) {
      entry.childWindows.add(childWin)
      childWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      childWin.on('closed', () => {
        entry.childWindows.delete(childWin)
      })
    } else if (details.url === 'about:blank') {
      childWin.on('close', (e) => {
        e.preventDefault()
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
    webPreferences: getPluginWebPreferences({ webviewTag: true }),
  })
  setupWindowOpenHandler(view.webContents)
  view.webContents.loadURL('about:blank')
  return view
}

export function getPluginView() {
  if (preloadPluginView) {
    const view = preloadPluginView
    preloadPluginView = null
    return view
  }

  return createPluginView()
}

export function getWebPluginView() {
  const view = new WebContentsView({
    webPreferences: {
      partition: PLUGIN_PARTITION,
    },
  })
  setupWindowOpenHandler(view.webContents)
  return view
}

export function preparePluginView() {
  if (!preloadPluginView) {
    preloadPluginView = createPluginView()
  }
}
