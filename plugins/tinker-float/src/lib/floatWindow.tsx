import toast from 'react-hot-toast'
import { openPopupWindow } from 'share/lib/popupWindow'
import FloatWindow from '../components/FloatWindow'
import store from '../store'

export function launchFloatWindow() {
  const width = store.windowWidth
  const height = store.windowHeight

  let webviewTimeout: ReturnType<typeof setTimeout> | null = null

  const urlSrc = store.urlSrc

  const popup = openPopupWindow(
    {
      width,
      height,
      minWidth: store.minWindowWidth,
      minHeight: store.minWindowHeight,
      alwaysOnTop: store.alwaysOnTop,
      webviewTag: store.contentType === 'url',
      transparent: store.contentType === 'image',
    },
    (_popup, onClose) => (
      <FloatWindow
        contentType={store.contentType}
        imageDataUrl={store.imageDataUrl}
        textContent={store.textContent}
        videoSrc={store.videoSrc}
        onClose={onClose}
        webviewSrc={urlSrc}
        onWebviewError={() => {
          _popup.close()
          toast.error(`Unable to load ${urlSrc}`)
        }}
        onWebviewReady={() => {
          if (webviewTimeout) clearTimeout(webviewTimeout)
        }}
      />
    )
  )
  if (!popup) return

  if (store.contentType === 'url') {
    webviewTimeout = setTimeout(() => {
      popup.close()
      toast.error(`Unable to load ${urlSrc}`)
    }, 15000)
  }

  popup.addEventListener('beforeunload', () => {
    if (webviewTimeout) clearTimeout(webviewTimeout)
  })

  store.clearContent()
}
