import { openPopupWindow } from 'share/lib/popupWindow'
import { storage } from 'share/store/Base'
import isObj from 'licia/isObj'
import isNum from 'licia/isNum'
import FloatingPie from '../components/FloatingPie'
import { DUAL_PIE_SIZE, type ScreenPoint } from '../types'

let pieWindow: Window | null = null
let invokeModeActive = false

const PIE_POSITION_KEY = 'pieMenu'
const PIE_POSITION_STORAGE_KEY = `popupWindow_${PIE_POSITION_KEY}`

const BASE_PIE_WINDOW = {
  width: DUAL_PIE_SIZE,
  height: DUAL_PIE_SIZE,
  resizable: false,
  transparent: true,
  alwaysOnTop: true,
  hasShadow: false,
} as const

interface SavedBounds {
  x: number
  y: number
  width: number
  height: number
}

function trackWindow(popup: Window | null, isInvoke: boolean) {
  pieWindow = popup
  invokeModeActive = isInvoke
  if (!popup) return
  popup.addEventListener('beforeunload', () => {
    if (pieWindow === popup) {
      pieWindow = null
      invokeModeActive = false
    }
  })
}

function readSavedBounds(): SavedBounds | null {
  const bounds = storage.get(PIE_POSITION_STORAGE_KEY)
  if (!isObj(bounds)) return null
  const b = bounds as SavedBounds
  if (!isNum(b.x) || !isNum(b.y) || !isNum(b.width) || !isNum(b.height)) {
    return null
  }
  return b
}

function persistPieBounds(x: number, y: number) {
  storage.set(PIE_POSITION_STORAGE_KEY, {
    x,
    y,
    width: DUAL_PIE_SIZE,
    height: DUAL_PIE_SIZE,
  })
}

export function closePieWindow() {
  if (pieWindow && !pieWindow.closed) {
    pieWindow.close()
  }
  pieWindow = null
  invokeModeActive = false
}

export function openAlwaysOnPieWindow() {
  if (pieWindow && !pieWindow.closed && !invokeModeActive) {
    return
  }
  closePieWindow()

  const prev = readSavedBounds()
  const x = prev
    ? Math.round(prev.x + prev.width / 2 - DUAL_PIE_SIZE / 2)
    : undefined
  const y = prev
    ? Math.round(prev.y + prev.height / 2 - DUAL_PIE_SIZE / 2)
    : undefined

  if (x != null && y != null) {
    persistPieBounds(x, y)
  }

  const popup = openPopupWindow(
    {
      ...BASE_PIE_WINDOW,
      ...(x != null && y != null ? { x, y } : {}),
      // Avoid "first click focuses, second click acts" on macOS.
      focusable: false,
      positionKey: PIE_POSITION_KEY,
    },
    (popupWin, onClose) => (
      <FloatingPie
        popup={popupWin}
        onClose={onClose}
        dismissOnAction={false}
        draggable
      />
    )
  )
  trackWindow(popup, false)
}

export function openInvokePieWindow(point: ScreenPoint) {
  const x = Math.round(point.x - DUAL_PIE_SIZE / 2)
  const y = Math.round(point.y - DUAL_PIE_SIZE / 2)

  if (pieWindow && !pieWindow.closed) {
    pieWindow.resizeTo(DUAL_PIE_SIZE, DUAL_PIE_SIZE)
    pieWindow.moveTo(x, y)
    pieWindow.focus()
    return
  }

  const popup = openPopupWindow(
    {
      ...BASE_PIE_WINDOW,
      x,
      y,
    },
    (popupWin, onClose) => (
      <FloatingPie
        popup={popupWin}
        onClose={onClose}
        dismissOnAction
        draggable={false}
      />
    )
  )
  trackWindow(popup, true)
}
