import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import { tw } from 'share/theme'
import VideoPlayer from 'share/components/VideoPlayer'
import i18n from '../i18n'
import store from '../store'

const { Provider, Container } = createPlayer({
  features: videoFeatures,
})

export default observer(function Preview() {
  const { t } = useTranslation()

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

  if (!store.hasContent) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${tw.text.secondary}`}
      >
        <p className="text-sm">{t('noContent')}</p>
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
