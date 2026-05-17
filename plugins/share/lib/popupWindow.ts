import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'

export interface PopupWindowOptions {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  alwaysOnTop?: boolean
  webviewTag?: boolean
  transparent?: boolean
  copyScripts?: string[]
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
    webviewTag,
    transparent = false,
    copyScripts = [],
  } = options

  const features = [
    `width=${width}`,
    `height=${height}`,
    minWidth != null ? `minWidth=${minWidth}` : '',
    minHeight != null ? `minHeight=${minHeight}` : '',
    `alwaysOnTop=${alwaysOnTop}`,
    'frame=no',
    webviewTag ? 'webviewTag=true' : '',
    transparent ? 'transparent=true' : '',
  ]
    .filter(Boolean)
    .join(',')

  const popup = window.open('', '_blank', features)
  if (!popup) return null

  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((node) => {
    popup.document.head.appendChild(node.cloneNode(true))
  })

  if (copyScripts.length > 0) {
    popup.tinker = window.tinker
    const scripts = document.querySelectorAll('script[src]')
    const loadPromises: Promise<void>[] = []
    scripts.forEach((node) => {
      const src = (node as HTMLScriptElement).src
      if (!src) return
      if (!copyScripts.some((s) => src.includes(s))) return
      const script = popup.document.createElement('script')
      script.src = src
      loadPromises.push(
        new Promise<void>((resolve) => {
          script.onload = () => resolve()
          script.onerror = () => resolve()
        })
      )
      popup.document.head.appendChild(script)
    })
    Promise.all(loadPromises).then(() => renderPopup())
  } else {
    renderPopup()
  }

  function renderPopup() {
    popup!.addEventListener('error', (e) => {
      console.error('[PopupWindow Error]', e.message, e.filename, e.lineno)
    })
    popup!.addEventListener('unhandledrejection', (e) => {
      console.error('[PopupWindow Unhandled Rejection]', e.reason)
    })

    const container = popup!.document.createElement('div')
    container.id = 'popup-root'
    popup!.document.body.style.margin = '0'
    if (transparent) {
      popup!.document.documentElement.style.backgroundColor = 'transparent'
      popup!.document.body.style.backgroundColor = 'transparent'
    }
    popup!.document.documentElement.className =
      document.documentElement.className
    popup!.document.body.appendChild(container)

    const root = createRoot(container)
    root.render(render(popup!, () => popup!.close()))

    popup!.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') popup!.close()
    })

    const unsubscribe = tinker.on('changeTheme', async () => {
      if (popup!.closed) return
      const theme = await tinker.getTheme()
      if (theme === 'dark') {
        popup!.document.documentElement.classList.add('dark')
      } else {
        popup!.document.documentElement.classList.remove('dark')
      }
    })

    popup!.addEventListener('beforeunload', () => {
      root.unmount()
      unsubscribe()
    })
  }

  return popup
}
