import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import once from 'licia/once'
import { getSettingsStore, getMainStore } from './store'
import * as main from '../window/main'
import isMac from 'licia/isMac'
import log from 'share/common/log'
import waitUntil from 'licia/waitUntil'
import { loadMod } from './util'

const logger = log('shortcut')

const settingsStore = getSettingsStore()
const mainStore = getMainStore()

type NodeMacPermissions = {
  getAuthStatus: (type: string) => string
  askForAccessibilityAccess: () => void
}

let nodeMacPermissions: NodeMacPermissions | null = null
if (isMac) {
  loadMod('node-mac-permissions').then((mod) => {
    nodeMacPermissions = mod
  })
}

const callbacks: Record<string, () => void> = {}

function register(accelerator: string, callback: () => void) {
  logger.info(`register shortcut: ${accelerator}`)
  if (isDoubleShortcut(accelerator)) {
    if (
      isMac &&
      mainStore.get('uIOhookCalled') &&
      nodeMacPermissions?.getAuthStatus('accessibility') === 'denied'
    ) {
      nodeMacPermissions?.askForAccessibilityAccess()
    } else {
      startUIOhook()
      callbacks[accelerator] = callback
    }
  } else {
    globalShortcut.register(accelerator, callback)
  }
}

function unregister(accelerator: string) {
  if (isDoubleShortcut(accelerator)) {
    delete callbacks[accelerator]
  } else {
    globalShortcut.unregister(accelerator)
  }
}

function isDoubleShortcut(accelerator: string): boolean {
  const [mod, key] = accelerator.split('+')
  if (!key || mod !== key) {
    return false
  }

  return true
}

const DOUBLE_PRESS_INTERVAL = 300

const startUIOhook = once(() => {
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

  if (isMac && !mainStore.get('uIOhookCalled')) {
    mainStore.set('uIOhookCalled', true)
  }
  setTimeout(() => uIOhook.start(), 1000)
})

export async function init() {
  if (isMac) {
    await waitUntil(() => nodeMacPermissions !== null)
  }
  register(settingsStore.get('showShortcut'), () => main.showWin())
  settingsStore.on('change', (key, val, oldVal) => {
    if (key === 'showShortcut') {
      unregister(oldVal)
      register(val, () => main.showWin())
    }
  })
}
