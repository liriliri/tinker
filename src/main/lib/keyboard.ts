import { ipcMain, WebContents } from 'electron'
import contain from 'licia/contain'
import log from 'share/common/log'
import { UiohookKey, type UiohookKeyboardEvent } from 'uiohook-napi'
import type { IKeyboardEvent, KeyboardEventName } from 'common/types'
import { ensureStarted, uIOhook } from './uiohook'

const logger = log('keyboard')

const EVENT_NAMES: KeyboardEventName[] = ['down', 'up']

const KEYCODE_TO_NAME: Record<number, string> = {}
for (const [name, code] of Object.entries(
  UiohookKey as Record<string, number>
)) {
  if (typeof code === 'number' && code !== 0) {
    KEYCODE_TO_NAME[code] = name
  }
}

const subscribers = new Map<KeyboardEventName, Set<WebContents>>()
const pluginEvents = new Map<WebContents, Set<KeyboardEventName>>()
const destroyedHooked = new WeakSet<WebContents>()
const pressed = new Set<number>()
let hookStarted = false

function fromKey(
  type: KeyboardEventName,
  event: UiohookKeyboardEvent
): IKeyboardEvent {
  const repeat = type === 'down' && pressed.has(event.keycode)
  if (type === 'down') {
    pressed.add(event.keycode)
  } else {
    pressed.delete(event.keycode)
  }
  return {
    type,
    keycode: event.keycode,
    key: KEYCODE_TO_NAME[event.keycode] || '',
    repeat,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  }
}

function emit(type: KeyboardEventName, payload: IKeyboardEvent) {
  const set = subscribers.get(type)
  if (!set || set.size === 0) return
  for (const webContents of [...set]) {
    if (webContents.isDestroyed()) {
      set.delete(webContents)
      continue
    }
    webContents.send('triggerKeyboard', type, payload)
  }
}

function onKeyDown(event: UiohookKeyboardEvent) {
  emit('down', fromKey('down', event))
}

function onKeyUp(event: UiohookKeyboardEvent) {
  emit('up', fromKey('up', event))
}

function startHook() {
  if (hookStarted) return
  uIOhook.on('keydown', onKeyDown)
  uIOhook.on('keyup', onKeyUp)
  hookStarted = true
}

function stopHook() {
  if (!hookStarted) return
  if (subscribers.get('down')?.size || subscribers.get('up')?.size) return
  uIOhook.off('keydown', onKeyDown)
  uIOhook.off('keyup', onKeyUp)
  hookStarted = false
  pressed.clear()
}

function ensureDestroyedCleanup(webContents: WebContents) {
  if (destroyedHooked.has(webContents)) return
  destroyedHooked.add(webContents)
  webContents.once('destroyed', () => {
    unregisterAll(webContents)
  })
}

function unregisterAll(webContents: WebContents) {
  const set = pluginEvents.get(webContents)
  if (!set) return
  for (const type of [...set]) {
    unregister(type, webContents)
  }
}

function register(type: KeyboardEventName, webContents: WebContents): boolean {
  if (!contain(EVENT_NAMES, type)) {
    return false
  }
  if (!ensureStarted()) {
    return false
  }

  let typeSet = subscribers.get(type)
  if (!typeSet) {
    typeSet = new Set()
    subscribers.set(type, typeSet)
  }
  typeSet.add(webContents)

  let owned = pluginEvents.get(webContents)
  if (!owned) {
    owned = new Set()
    pluginEvents.set(webContents, owned)
  }
  owned.add(type)
  startHook()
  ensureDestroyedCleanup(webContents)

  logger.info(`register keyboard: ${type}`)
  return true
}

function unregister(type: KeyboardEventName, webContents: WebContents) {
  subscribers.get(type)?.delete(webContents)
  pluginEvents.get(webContents)?.delete(type)
  if (pluginEvents.get(webContents)?.size === 0) {
    pluginEvents.delete(webContents)
  }
  stopHook()
}

export function init() {
  ipcMain.handle('registerKeyboard', (event, type: KeyboardEventName) => {
    return register(type, event.sender)
  })
  ipcMain.handle('unregisterKeyboard', (event, type: KeyboardEventName) => {
    unregister(type, event.sender)
  })
}
