import { globalShortcut, ipcMain, WebContents } from 'electron'
import once from 'licia/once'
import { getSettingsStore } from './store'
import * as main from '../window/main'
import log from 'share/common/log'
import { UiohookKey } from 'uiohook-napi'
import { ensureStarted, init as initUIOhook, uIOhook } from './uiohook'

const logger = log('shortcut')

const settingsStore = getSettingsStore()

type ShortcutOwner = 'app' | WebContents

const callbacks: Record<string, () => void> = {}
const owners = new Map<string, ShortcutOwner>()
const pluginAccelerators = new Map<WebContents, Set<string>>()
const destroyedHooked = new WeakSet<WebContents>()

function isDoubleShortcut(accelerator: string): boolean {
  const [mod, key] = accelerator.split('+')
  if (!key || mod !== key) {
    return false
  }

  return true
}

const DOUBLE_PRESS_INTERVAL = 300

const attachDoubleKeyListeners = once(() => {
  const keyMap: Record<number, string> = {
    [UiohookKey.Ctrl]: 'Ctrl',
    [UiohookKey.CtrlRight]: 'Ctrl',
  }

  const lastPressTime: Record<string, number> = {}
  const keyPressed: Record<string, boolean> = {}

  uIOhook.on('keydown', (event) => {
    const keyName = keyMap[event.keycode]
    if (!keyName) return
    if (keyPressed[keyName]) return

    keyPressed[keyName] = true
    const now = Date.now()
    const last = lastPressTime[keyName] || 0
    lastPressTime[keyName] = now

    if (now - last < DOUBLE_PRESS_INTERVAL) {
      const accelerator = `${keyName}+${keyName}`
      if (callbacks[accelerator]) {
        callbacks[accelerator]()
      }
      lastPressTime[keyName] = 0
    }
  })

  uIOhook.on('keyup', (event) => {
    const keyName = keyMap[event.keycode]
    if (!keyName) return

    keyPressed[keyName] = false
  })
})

function bindAccelerator(accelerator: string, callback: () => void): boolean {
  logger.info(`register shortcut: ${accelerator}`)
  if (isDoubleShortcut(accelerator)) {
    attachDoubleKeyListeners()
    if (!ensureStarted()) {
      return false
    }
    callbacks[accelerator] = callback
    return true
  }

  return globalShortcut.register(accelerator, callback)
}

function unbindAccelerator(accelerator: string) {
  if (isDoubleShortcut(accelerator)) {
    delete callbacks[accelerator]
  } else {
    globalShortcut.unregister(accelerator)
  }
}

function register(
  accelerator: string,
  callback: () => void,
  owner: ShortcutOwner = 'app'
): boolean {
  const existing = owners.get(accelerator)
  if (existing !== undefined && existing !== owner) {
    if (owner !== 'app') {
      return false
    }
    detachOwner(accelerator, existing)
    unbindAccelerator(accelerator)
  } else if (existing === owner) {
    unbindAccelerator(accelerator)
  }

  if (!bindAccelerator(accelerator, callback)) {
    return false
  }

  owners.set(accelerator, owner)
  if (owner !== 'app') {
    let set = pluginAccelerators.get(owner)
    if (!set) {
      set = new Set()
      pluginAccelerators.set(owner, set)
    }
    set.add(accelerator)
  }

  return true
}

function detachOwner(accelerator: string, owner: ShortcutOwner) {
  owners.delete(accelerator)
  if (owner !== 'app') {
    pluginAccelerators.get(owner)?.delete(accelerator)
  }
}

function unregister(accelerator: string) {
  const owner = owners.get(accelerator)
  if (owner !== undefined) {
    detachOwner(accelerator, owner)
  }
  unbindAccelerator(accelerator)
}

function ensureDestroyedCleanup(webContents: WebContents) {
  if (destroyedHooked.has(webContents)) {
    return
  }
  destroyedHooked.add(webContents)
  webContents.once('destroyed', () => {
    unregisterPluginShortcuts(webContents)
  })
}

function unregisterPluginShortcuts(webContents: WebContents) {
  const set = pluginAccelerators.get(webContents)
  if (!set) {
    return
  }
  for (const accelerator of [...set]) {
    unregister(accelerator)
  }
  pluginAccelerators.delete(webContents)
}

function registerPluginShortcut(
  accelerator: string,
  webContents: WebContents
): boolean {
  const ok = register(
    accelerator,
    () => {
      if (!webContents.isDestroyed()) {
        webContents.send('triggerShortcut', accelerator)
      }
    },
    webContents
  )
  if (ok) {
    ensureDestroyedCleanup(webContents)
  }
  return ok
}

function unregisterPluginShortcut(
  accelerator: string,
  webContents: WebContents
) {
  if (owners.get(accelerator) !== webContents) {
    return
  }
  unregister(accelerator)
}

export async function init() {
  await initUIOhook()
  register(settingsStore.get('showShortcut'), () => main.showWin(), 'app')
  settingsStore.on('change', (key, val, oldVal) => {
    if (key === 'showShortcut') {
      unregister(oldVal)
      register(val, () => main.showWin(), 'app')
    }
  })

  ipcMain.handle('registerShortcut', (event, accelerator: string) => {
    return registerPluginShortcut(accelerator, event.sender)
  })
  ipcMain.handle('unregisterShortcut', (event, accelerator: string) => {
    unregisterPluginShortcut(accelerator, event.sender)
  })
}
