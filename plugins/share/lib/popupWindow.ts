import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { storage } from 'share/store/Base'

export interface PopupWindowOptions {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  alwaysOnTop?: boolean
  resizable?: boolean
  webviewTag?: boolean
  transparent?: boolean
  positionKey?: string
}

interface PopupBounds {
  x: number
  y: number
  width: number
  height: number
}

function getPositionStorageKey(positionKey: string) {
  return `popupWindow_${positionKey}`
}

export function openPopupWindow(
  options: PopupWindowOptions,
  render: (popup: Window, onClose: () => void) => ReactNode
): Window | null {
  const {
    width,
    height,
    minWidth,
    minHeight,
    alwaysOnTop = true,
    resizable = true,
    webviewTag,
    transparent = false,
    positionKey,
  } = options

  let savedBounds: PopupBounds | null = null
  if (positionKey) {
    const bounds = storage.get(getPositionStorageKey(positionKey))
    if (
      bounds &&
      typeof bounds.x === 'number' &&
      typeof bounds.y === 'number' &&
      typeof bounds.width === 'number' &&
      typeof bounds.height === 'number'
    ) {
      savedBounds = bounds
    }
  }

  const actualWidth = savedBounds?.width ?? width
  const actualHeight = savedBounds?.height ?? height

  const features = [
    `width=${actualWidth}`,
    `height=${actualHeight}`,
    minWidth != null ? `minWidth=${minWidth}` : '',
    minHeight != null ? `minHeight=${minHeight}` : '',
    `alwaysOnTop=${alwaysOnTop}`,
    `resizable=${resizable ? 'yes' : 'no'}`,
    'frame=no',
    webviewTag ? 'webviewTag=true' : '',
    transparent ? 'transparent=true' : '',
    savedBounds ? `left=${savedBounds.x}` : '',
    savedBounds ? `top=${savedBounds.y}` : '',
  ]
    .filter(Boolean)
    .join(',')

  const popup = window.open('', '_blank', features)
  if (!popup) return null
  ;(popup as unknown as { tinker: typeof tinker }).tinker = tinker

  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((node) => {
    popup.document.head.appendChild(node.cloneNode(true))
  })

  popup.addEventListener('error', (e) => {
    console.error('[PopupWindow Error]', e.message, e.filename, e.lineno)
  })
  popup.addEventListener('unhandledrejection', (e) => {
    console.error('[PopupWindow Unhandled Rejection]', e.reason)
  })

  const container = popup.document.createElement('div')
  container.id = 'popup-root'
  popup.document.body.style.margin = '0'
  if (transparent) {
    popup.document.documentElement.style.backgroundColor = 'transparent'
    popup.document.body.style.backgroundColor = 'transparent'
  }
  popup.document.documentElement.className = document.documentElement.className
  popup.document.body.appendChild(container)

  const root = createRoot(container)
  root.render(render(popup, () => popup.close()))

  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') popup.close()
  })

  const unsubscribe = tinker.on('changeTheme', async () => {
    if (popup.closed) return
    const theme = await tinker.getTheme()
    if (theme === 'dark') {
      popup.document.documentElement.classList.add('dark')
    } else {
      popup.document.documentElement.classList.remove('dark')
    }
  })

  popup.addEventListener('beforeunload', () => {
    if (positionKey) {
      const bounds: PopupBounds = {
        x: popup.screenX,
        y: popup.screenY,
        width: popup.outerWidth,
        height: popup.outerHeight,
      }
      storage.set(getPositionStorageKey(positionKey), bounds)
    }
    root.unmount()
    unsubscribe()
  })

  return popup
}
