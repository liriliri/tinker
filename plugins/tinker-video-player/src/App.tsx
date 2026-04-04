import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import { tw } from 'share/theme'
import store from './store'
import VideoSkin from './components/VideoSkin'
import MediaInfoDialog from './components/MediaInfoDialog'

const { Provider, Container } = createPlayer({
  features: videoFeatures,
})

export default observer(function App() {
  const { t } = useTranslation()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.path) {
      store.setVideo(file.path)
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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!store.hasVideo) return
      e.preventDefault()
      tinker.showContextMenu(e.clientX, e.clientY, [
        { label: t('open'), click: () => store.openFile() },
        { type: 'separator' },
        { label: t('fileInfo'), click: () => store.fetchMediaInfo() },
      ])
    },
    [t]
  )

  return (
    <div
      className="relative h-screen"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
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
      <MediaInfoDialog />
    </div>
  )
})
