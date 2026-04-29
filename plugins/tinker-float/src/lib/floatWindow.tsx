import { createRoot } from 'react-dom/client'
import toast from 'react-hot-toast'
import FloatWindow from '../components/FloatWindow'
import store from '../store'

export function launchFloatWindow() {
  const width = store.windowWidth
  const height =
    store.contentType === 'image' ? store.effectiveHeight : store.windowHeight
  const alwaysOnTop = store.alwaysOnTop ? 'true' : 'false'

  const webviewTag = store.contentType === 'url' ? ',webviewTag=true' : ''

  const popup = window.open(
    '',
    '_blank',
    `width=${width},height=${height},minWidth=${store.minWindowWidth},minHeight=${store.minWindowHeight},alwaysOnTop=${alwaysOnTop},frame=no${webviewTag}`
  )
  if (!popup) return

  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((node) => {
    popup.document.head.appendChild(node.cloneNode(true))
  })

  const container = popup.document.createElement('div')
  container.id = 'popup-root'
  popup.document.body.style.margin = '0'
  popup.document.documentElement.className = document.documentElement.className
  popup.document.body.appendChild(container)

  const root = createRoot(container)
  root.render(
    <FloatWindow
      contentType={store.contentType}
      imageDataUrl={store.imageDataUrl}
      textContent={store.textContent}
      videoSrc={store.videoSrc}
      onClose={() => popup.close()}
    />
  )

  let webviewTimeout: ReturnType<typeof setTimeout> | null = null

  if (store.contentType === 'url') {
    const urlSrc = store.urlSrc
    // Wait for React render to complete before inserting webview
    setTimeout(() => {
      const webview = popup.document.createElement('webview') as HTMLElement
      webview.setAttribute('src', urlSrc)
      webview.style.width = '100%'
      webview.style.height = '100%'
      const webviewContainer =
        popup.document.getElementById('webview-container')
      if (webviewContainer) {
        webviewContainer.appendChild(webview)

        const handleError = () => {
          popup.close()
          toast.error(`Unable to load ${urlSrc}`)
        }

        webview.addEventListener('did-fail-load', ((e: Event) => {
          const detail = e as Event & { errorCode: number }
          // errorCode -3 is aborted, ignore
          if (detail.errorCode === -3) return
          handleError()
        }) as EventListener)

        // Fallback: if webview doesn't fire dom-ready within 15s
        webviewTimeout = setTimeout(() => {
          if (!webview.isConnected) return
          handleError()
        }, 15000)

        webview.addEventListener('dom-ready', () => {
          if (webviewTimeout) clearTimeout(webviewTimeout)
        })
      }
    }, 0)
  }

  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') popup.close()
  })

  popup.addEventListener('beforeunload', () => {
    if (webviewTimeout) clearTimeout(webviewTimeout)
    root.unmount()
  })

  store.clearContent()
}
