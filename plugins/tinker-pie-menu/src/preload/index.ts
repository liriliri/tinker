import { contextBridge, screen } from 'electron'
import { exec } from 'child_process'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import replaceAll from 'licia/replaceAll'
import { uIOhook, type UiohookMouseEvent } from 'uiohook-napi'

const MOUSE_MIDDLE = 3
const LONG_PRESS_MS = 450

function quote(path: string) {
  return `"${replaceAll(path, '"', '\\"')}"`
}

type MiddleClickHandler = (point: { x: number; y: number }) => void

let middleClickHandler: MiddleClickHandler | null = null
let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressPoint: { x: number; y: number } | null = null
let hookStarted = false

function clearPressTimer() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  pressPoint = null
}

function isMiddleButton(event: UiohookMouseEvent) {
  return Number(event.button) === MOUSE_MIDDLE
}

function onMouseDown(event: UiohookMouseEvent) {
  if (!middleClickHandler || !isMiddleButton(event)) return
  clearPressTimer()
  pressPoint = { x: event.x, y: event.y }
  pressTimer = setTimeout(() => {
    const point = pressPoint
    pressTimer = null
    pressPoint = null
    if (point && middleClickHandler) {
      middleClickHandler(point)
    }
  }, LONG_PRESS_MS)
}

function onMouseUp(event: UiohookMouseEvent) {
  if (!isMiddleButton(event)) return
  clearPressTimer()
}

function onMouseMove(event: UiohookMouseEvent) {
  if (!pressPoint) return
  const dx = event.x - pressPoint.x
  const dy = event.y - pressPoint.y
  if (dx * dx + dy * dy > 100) {
    clearPressTimer()
  }
}

function ensureHook() {
  if (hookStarted) return
  uIOhook.on('mousedown', onMouseDown)
  uIOhook.on('mouseup', onMouseUp)
  uIOhook.on('mousemove', onMouseMove)
  uIOhook.start()
  hookStarted = true
}

const api = {
  execCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      exec(cmd, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || (error ? error.message : ''),
          stderr: stderr || '',
        })
      })
    })
  },

  openApp(appPath: string): Promise<{ stdout: string; stderr: string }> {
    let cmd: string
    if (isMac) {
      cmd = `open ${quote(appPath)}`
    } else if (isWindows) {
      cmd = quote(appPath)
    } else {
      cmd = appPath
    }
    return api.execCommand(cmd)
  },

  openDirectory(dirPath: string): Promise<{ stdout: string; stderr: string }> {
    let cmd: string
    if (isMac) {
      cmd = `open ${quote(dirPath)}`
    } else if (isWindows) {
      cmd = `explorer ${quote(dirPath)}`
    } else {
      cmd = `xdg-open ${quote(dirPath)}`
    }
    return api.execCommand(cmd)
  },

  getCursorPoint(): { x: number; y: number } {
    const point = screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  },

  startMiddleClickListen(handler: MiddleClickHandler) {
    middleClickHandler = handler
    ensureHook()
  },

  stopMiddleClickListen() {
    middleClickHandler = null
    clearPressTimer()
  },
}

contextBridge.exposeInMainWorld('pieMenu', api)

declare global {
  const pieMenu: typeof api
}
