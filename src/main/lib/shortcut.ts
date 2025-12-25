import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import once from 'licia/once'
import { getSettingsStore, getMainStore } from './store'
import * as main from '../window/main'
import isMac from 'licia/isMac'
import { NodeMacPermissions } from 'common/types'
import log from 'share/common/log'
import waitUntil from 'licia/waitUntil'

const logger = log('shortcut')

const settingsStore = getSettingsStore()
const mainStore = getMainStore()

let nodeMacPermissions: NodeMacPermissions | null = null
if (isMac) {
  ;(async () => {
    try {
      const mod = await import('node-mac-permissions')
      nodeMacPermissions = mod.default || mod
    } catch (e) {
      logger.error('failed to load node-mac-permissions:', e)
      nodeMacPermissions = null
    }
  })()
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
  const lastPressTime: Record<string, number> = {}
  uIOhook.on('keydown', (event) => {
    const keyMap: Record<number, string> = {
      [UiohookKey.Ctrl]: 'Ctrl',
      [UiohookKey.CtrlRight]: 'Ctrl',
    }
    const keyName = keyMap[event.keycode]
    if (!keyName) return

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
