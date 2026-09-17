import { openPopupWindow } from 'share/lib/popupWindow'
import KeyOverlay from '../components/KeyOverlay'

const OVERLAY_WIDTH = 720
const OVERLAY_HEIGHT = 140

let keyOverlayWindow: Window | null = null
let onClosedCallback: (() => void) | null = null

function notifyClosed() {
  keyOverlayWindow = null
  const cb = onClosedCallback
  onClosedCallback = null
  cb?.()
}

export function getKeyOverlayWindow(): Window | null {
  if (keyOverlayWindow && keyOverlayWindow.closed) {
    notifyClosed()
  }
  return keyOverlayWindow
}

export function closeKeyOverlayWindow() {
  const win = getKeyOverlayWindow()
  if (win) {
    win.close()
  }
  notifyClosed()
}

export function openKeyOverlayWindow(onClosed?: () => void): Window | null {
  if (getKeyOverlayWindow()) {
    return keyOverlayWindow
  }

  onClosedCallback = onClosed ?? null

  const popup = openPopupWindow(
    {
      width: OVERLAY_WIDTH,
      height: OVERLAY_HEIGHT,
      minWidth: 200,
      minHeight: 88,
      transparent: true,
      alwaysOnTop: true,
      resizable: true,
      hasShadow: false,
      focusable: true,
      closeOnEscape: false,
      positionKey: 'screenRecorderKeyOverlayV2',
    },
    (win, onClose) => <KeyOverlay popup={win} onClose={onClose} />
  )

  if (!popup) {
    onClosedCallback = null
    return null
  }

  keyOverlayWindow = popup
  popup.addEventListener('beforeunload', () => {
    notifyClosed()
  })

  return popup
}
