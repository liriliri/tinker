import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import { tw } from 'share/theme'
import fileUrl from 'licia/fileUrl'
import store from './store'
import VideoSkin from './components/VideoSkin'

const { Provider, Container } = createPlayer({
  features: videoFeatures,
})

export default observer(function App() {
  const { t } = useTranslation()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.path) {
      store.setVideoSrc(fileUrl(file.path))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

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

  return (
    <div
      className="relative h-screen"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Provider>
        <Container className="h-full">
          <VideoSkin>
            <Video
              src={store.videoSrc || undefined}
              autoPlay={store.hasVideo}
              onClick={handleVideoClick}
            />
          </VideoSkin>
        </Container>
      </Provider>
      {!store.hasVideo && (
        <button
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10"
          onClick={() => store.openFile()}
        >
          <FolderOpen
            className={`${tw.text.primary} opacity-50 hover:opacity-80 transition-opacity`}
            size={48}
          />
          <span className={`mt-3 text-sm ${tw.text.secondary} opacity-50`}>
            {t('dropOrOpen')}
          </span>
        </button>
      )}
    </div>
  )
})
