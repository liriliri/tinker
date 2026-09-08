import type { ReactNode } from 'react'
import { openPopupWindow } from 'share/lib/popupWindow'
import FloatingPie from '../components/FloatingPie'

export const PIE_WINDOW_SIZE = 300

let pieWindow: Window | null = null
let invokeModeActive = false

function renderFloatingPie(
  onClose: () => void,
  options: { dismissOnAction: boolean; draggable: boolean }
): ReactNode {
  return (
    <FloatingPie
      onClose={onClose}
      dismissOnAction={options.dismissOnAction}
      draggable={options.draggable}
    />
  )
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

export function closePieWindow() {
  if (pieWindow && !pieWindow.closed) {
    pieWindow.close()
  }
  pieWindow = null
  invokeModeActive = false
}

export function openAlwaysOnPieWindow() {
  if (pieWindow && !pieWindow.closed && !invokeModeActive) {
    pieWindow.focus()
    return
  }
  closePieWindow()
  const popup = openPopupWindow(
    {
      width: PIE_WINDOW_SIZE,
      height: PIE_WINDOW_SIZE,
      resizable: false,
      transparent: true,
      alwaysOnTop: true,
      positionKey: 'pieMenu',
    },
    (_win, onClose) =>
      renderFloatingPie(onClose, {
        dismissOnAction: false,
        draggable: true,
      })
  )
  trackWindow(popup, false)
}

export function openInvokePieWindow(point: { x: number; y: number }) {
  const x = Math.round(point.x - PIE_WINDOW_SIZE / 2)
  const y = Math.round(point.y - PIE_WINDOW_SIZE / 2)

  if (pieWindow && !pieWindow.closed) {
    pieWindow.moveTo(x, y)
    pieWindow.focus()
    return
  }

  const popup = openPopupWindow(
    {
      width: PIE_WINDOW_SIZE,
      height: PIE_WINDOW_SIZE,
      resizable: false,
      transparent: true,
      alwaysOnTop: true,
      x,
      y,
    },
    (_win, onClose) =>
      renderFloatingPie(onClose, {
        dismissOnAction: true,
        draggable: false,
      })
  )
  trackWindow(popup, true)
}
