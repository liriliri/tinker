import { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import VideoPlayer from 'share/components/VideoPlayer'
import i18n from '../i18n'
import store from '../store'

const { Provider, Container } = createPlayer({
  features: videoFeatures,
})

export default observer(function Preview() {
  const { t } = useTranslation()

  const webviewRef = useRef<HTMLWebViewElement>(null)

  const handleVideoClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const video = e.currentTarget
      if (video.paused) {
        video.play()
      } else {
        video.pause()
      }
    },
    []
  )

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const onFailLoad = (e: Event) => {
      const detail = e as Event & {
        errorCode: number
        errorDescription: string
      }
      if (detail.errorCode === -3) return
      store.setUrlLoading(false)
      store.clearContent()
      toast.error(detail.errorDescription || t('loadFailed'))
    }
    const onDomReady = () => {
      store.setUrlLoading(false)
    }

    webview.addEventListener('did-fail-load', onFailLoad)
    webview.addEventListener('dom-ready', onDomReady)

    return () => {
      webview.removeEventListener('did-fail-load', onFailLoad)
      webview.removeEventListener('dom-ready', onDomReady)
    }
  }, [store.urlSrc])

  if (!store.hasContent) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${tw.text.secondary}`}
      >
        <p className="text-sm">{t('noContent')}</p>
      </div>
    )
  }

  if (store.contentType === 'url') {
    return (
      <div className="flex-1 overflow-hidden relative">
        <webview
          ref={webviewRef}
          src={store.urlSrc}
          className={`w-full h-full${store.urlLoading ? ' invisible' : ''}`}
        />
        {store.urlLoading && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${tw.text.secondary}`}
          >
            <p className="text-sm">{t('loading')}</p>
          </div>
        )}
      </div>
    )
  }

  if (store.contentType === 'video') {
    return (
      <div className="flex-1 overflow-hidden">
        <Provider>
          <Container className="h-full">
            <VideoPlayer locale={i18n.language}>
              <Video src={store.videoSrc} onClick={handleVideoClick} />
            </VideoPlayer>
          </Container>
        </Provider>
      </div>
    )
  }

  if (store.contentType === 'image') {
    return (
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <img
          src={store.imageDataUrl}
          className="max-w-full max-h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget
            if (
              img.naturalWidth !== store.imageNaturalWidth ||
              img.naturalHeight !== store.imageNaturalHeight
            ) {
              store.setImageNaturalSize(img.naturalWidth, img.naturalHeight)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-auto p-4 ${tw.text.primary}`}>
      <pre className="whitespace-pre-wrap break-words text-sm font-sans">
        {store.textContent}
      </pre>
    </div>
  )
})
