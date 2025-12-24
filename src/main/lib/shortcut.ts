import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import once from 'licia/once'

const callbacks: Record<string, () => void> = {}

export function register(accelerator: string, callback: () => void) {
  if (isDoubleShortcut(accelerator)) {
    startUIOhook()
    callbacks[accelerator] = callback
  } else {
    globalShortcut.register(accelerator, callback)
  }
}

export function unregister(accelerator: string) {
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

  uIOhook.start()
})
