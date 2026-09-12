import { ipcMain, screen, WebContents } from 'electron'
import contain from 'licia/contain'
import isMac from 'licia/isMac'
import log from 'share/common/log'
import {
  WheelDirection,
  type UiohookMouseEvent,
  type UiohookWheelEvent,
} from 'uiohook-napi'
import type { IMouseEvent, MouseButton, MouseEventName } from 'common/types'
import { ensureStarted, uIOhook } from './uiohook'

const logger = log('mouse')

const EVENT_NAMES: MouseEventName[] = ['down', 'up', 'move', 'click', 'wheel']

const subscribers = new Map<MouseEventName, Set<WebContents>>()
const pluginEvents = new Map<WebContents, Set<MouseEventName>>()
const listening = new Set<MouseEventName>()
const destroyedHooked = new WeakSet<WebContents>()

function mapButton(button: unknown): MouseButton {
  switch (Number(button)) {
    case 1:
      return 'left'
    case 2:
      return 'right'
    case 3:
      return 'middle'
    case 4:
      return 'back'
    case 5:
      return 'forward'
    default:
      return 'unknown'
  }
}

function baseFields(event: UiohookMouseEvent | UiohookWheelEvent) {
  const point = { x: event.x, y: event.y }
  const { x, y } = isMac ? point : screen.screenToDipPoint(point)
  return {
    x,
    y,
    clicks: event.clicks,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  }
}

function fromMouse(
  type: Exclude<MouseEventName, 'wheel'>,
  event: UiohookMouseEvent
): IMouseEvent {
  return {
    type,
    button: mapButton(event.button),
    ...baseFields(event),
  }
}

function fromWheel(event: UiohookWheelEvent): IMouseEvent {
  return {
    type: 'wheel',
    button: 'unknown',
    ...baseFields(event),
    amount: event.amount,
    direction:
      event.direction === WheelDirection.HORIZONTAL ? 'horizontal' : 'vertical',
    rotation: event.rotation,
  }
}

function emit(type: MouseEventName, payload: IMouseEvent) {
  const set = subscribers.get(type)
  if (!set || set.size === 0) return
  for (const webContents of [...set]) {
    if (webContents.isDestroyed()) {
      set.delete(webContents)
      continue
    }
    webContents.send('triggerMouse', type, payload)
  }
}

const handlers = {
  down: (event: UiohookMouseEvent) => emit('down', fromMouse('down', event)),
  up: (event: UiohookMouseEvent) => emit('up', fromMouse('up', event)),
  move: (event: UiohookMouseEvent) => emit('move', fromMouse('move', event)),
  click: (event: UiohookMouseEvent) => emit('click', fromMouse('click', event)),
  wheel: (event: UiohookWheelEvent) => emit('wheel', fromWheel(event)),
}

function startListening(type: MouseEventName) {
  if (listening.has(type)) return
  switch (type) {
    case 'down':
      uIOhook.on('mousedown', handlers.down)
      break
    case 'up':
      uIOhook.on('mouseup', handlers.up)
      break
    case 'move':
      uIOhook.on('mousemove', handlers.move)
      break
    case 'click':
      uIOhook.on('click', handlers.click)
      break
    case 'wheel':
      uIOhook.on('wheel', handlers.wheel)
      break
  }
  listening.add(type)
}

function stopListening(type: MouseEventName) {
  if (!listening.has(type)) return
  if (subscribers.get(type)?.size) return
  switch (type) {
    case 'down':
      uIOhook.off('mousedown', handlers.down)
      break
    case 'up':
      uIOhook.off('mouseup', handlers.up)
      break
    case 'move':
      uIOhook.off('mousemove', handlers.move)
      break
    case 'click':
      uIOhook.off('click', handlers.click)
      break
    case 'wheel':
      uIOhook.off('wheel', handlers.wheel)
      break
  }
  listening.delete(type)
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

function register(type: MouseEventName, webContents: WebContents): boolean {
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
  startListening(type)
  ensureDestroyedCleanup(webContents)

  logger.info(`register mouse: ${type}`)
  return true
}

function unregister(type: MouseEventName, webContents: WebContents) {
  subscribers.get(type)?.delete(webContents)
  pluginEvents.get(webContents)?.delete(type)
  if (pluginEvents.get(webContents)?.size === 0) {
    pluginEvents.delete(webContents)
  }
  stopListening(type)
}

export function init() {
  ipcMain.handle('registerMouse', (event, type: MouseEventName) => {
    return register(type, event.sender)
  })
  ipcMain.handle('unregisterMouse', (event, type: MouseEventName) => {
    unregister(type, event.sender)
  })
}
