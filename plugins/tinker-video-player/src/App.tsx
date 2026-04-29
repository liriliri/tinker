import { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import { FolderOpen } from 'lucide-react'
import { tw } from 'share/theme'
import { ConfirmProvider } from 'share/components/Confirm'
import VideoPlayer from 'share/components/VideoPlayer'
import i18n from './i18n'
import store from './store'
import MediaInfoDialog from './components/MediaInfoDialog'
import PlaylistPanel from './components/PlaylistPanel'

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

  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget
      const saved = store.getSavedProgress(store.filePath)
      if (saved > 0 && saved < video.duration - 1) {
        video.currentTime = saved
      }
    },
    []
  )

  const startSaveTimer = useCallback((video: HTMLVideoElement) => {
    if (saveTimerRef.current) return
    saveTimerRef.current = setInterval(() => {
      store.saveProgress(video.currentTime)
    }, 3000)
  }, [])

  const stopSaveTimer = useCallback((video: HTMLVideoElement) => {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
      saveTimerRef.current = null
    }
    store.saveProgress(video.currentTime)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
      }
    }
  }, [])

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
    <ConfirmProvider locale={i18n.language}>
      <div
        className="relative h-screen"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onContextMenu={handleContextMenu}
      >
        <Provider>
          <Container className="h-full">
            <VideoPlayer
              locale={i18n.language}
              disabled={!store.hasVideo}
              onTogglePlaylist={() => store.togglePlaylist()}
            >
              <Video
                src={store.videoSrc || undefined}
                autoPlay={store.hasVideo}
                onClick={handleVideoClick}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={(e: React.SyntheticEvent<HTMLVideoElement>) =>
                  startSaveTimer(e.currentTarget)
                }
                onPause={(e: React.SyntheticEvent<HTMLVideoElement>) =>
                  stopSaveTimer(e.currentTarget)
                }
                onEnded={(e: React.SyntheticEvent<HTMLVideoElement>) =>
                  stopSaveTimer(e.currentTarget)
                }
              />
            </VideoPlayer>
          </Container>
        </Provider>
        {!store.hasVideo && (
          <button
            className="absolute inset-0 bottom-12 flex flex-col items-center justify-center cursor-pointer z-10"
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
        <PlaylistPanel />
      </div>
    </ConfirmProvider>
  )
})
