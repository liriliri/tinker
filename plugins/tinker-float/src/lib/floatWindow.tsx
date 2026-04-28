import { createRoot } from 'react-dom/client'
import FloatWindow from '../components/FloatWindow'
import store from '../store'

export function launchFloatWindow() {
  const width = store.windowWidth
  const height =
    store.contentType === 'image' ? store.effectiveHeight : store.windowHeight
  const alwaysOnTop = store.alwaysOnTop ? 'true' : 'false'

  const popup = window.open(
    '',
    '_blank',
    `width=${width},height=${height},alwaysOnTop=${alwaysOnTop},frame=no`
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
    />
  )

  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') popup.close()
  })

  popup.addEventListener('beforeunload', () => {
    root.unmount()
  })

  store.clearContent()
}
