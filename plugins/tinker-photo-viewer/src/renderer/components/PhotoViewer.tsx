import { observer } from 'mobx-react-lite'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import store from '../store'
import { prefetchPhotoPreview } from '../lib/preview'
import PhotoInfoPanel from './PhotoInfoPanel'
import ProgressivePhotoImage from './ProgressivePhotoImage'
import ViewerThumbnail from './ViewerThumbnail'

const PhotoViewer = observer(function PhotoViewer() {
  const { t } = useTranslation()
  const photos = store.photos
  const currentPhoto = store.currentPhoto
  const currentIndex = store.viewerIndex

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!store.viewerOpen) return

    if (event.key === 'Escape') {
      store.closeViewer()
    } else if (event.key === 'ArrowLeft') {
      store.showPrevPhoto()
    } else if (event.key === 'ArrowRight') {
      store.showNextPhoto()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!store.viewerOpen) return

    for (const offset of [-1, 1]) {
      const photo = photos[currentIndex + offset]
      if (photo) prefetchPhotoPreview(photo.path)
    }
  }, [currentIndex, photos, store.viewerOpen])

  if (!store.viewerOpen || !currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between px-3 text-white">
          <div className="truncate text-sm">
            {currentPhoto.title} ({currentIndex + 1}/{photos.length})
          </div>
          <button
            type="button"
            onClick={() => store.closeViewer()}
            className="rounded p-2 hover:bg-white/10"
            title={t('closeViewer')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <button
            type="button"
            onClick={() => store.showPrevPhoto()}
            disabled={currentIndex <= 0}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-30"
            title={t('prevPhoto')}
          >
            <ChevronLeft size={24} />
          </button>

          <ProgressivePhotoImage
            key={currentPhoto.id}
            path={currentPhoto.path}
            alt={currentPhoto.title}
          />

          <button
            type="button"
            onClick={() => store.showNextPhoto()}
            disabled={currentIndex >= photos.length - 1}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-30"
            title={t('nextPhoto')}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {photos.length > 1 && (
          <div className="flex h-16 shrink-0 items-center gap-1 overflow-x-auto border-t border-white/10 px-3">
            {photos.map((photo, index) => {
              const aspectRatio =
                photo.width > 0 && photo.height > 0
                  ? photo.width / photo.height
                  : 1
              const thumbWidth = 48 * aspectRatio

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => store.setViewerIndex(index)}
                  className={`h-12 shrink-0 overflow-hidden rounded border-2 transition-all ${
                    index === currentIndex
                      ? 'scale-105 border-white opacity-100'
                      : 'border-transparent opacity-50 grayscale hover:opacity-80'
                  }`}
                  style={{ width: `${Math.max(thumbWidth, 32)}px` }}
                >
                  <ViewerThumbnail path={photo.path} alt={photo.title} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <PhotoInfoPanel photo={currentPhoto} />
    </div>
  )
})

export default PhotoViewer
