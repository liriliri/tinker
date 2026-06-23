import { useCallback, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import ThumbnailStrip from './ThumbnailStrip'
import type { PhotoViewerItem, PhotoViewerProps } from './types'
import ViewerBlurBackground from './ViewerBlurBackground'
import ViewerPhotoImage from './ViewerPhotoImage'

const NAV_BTN_CLASS =
  'absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 pointer-events-none transition-opacity duration-200 hover:bg-black/70 group-hover:pointer-events-auto group-hover:opacity-100 disabled:group-hover:opacity-30'

export default function PhotoViewer<T extends PhotoViewerItem>({
  open,
  items,
  currentIndex,
  onClose,
  onIndexChange,
  labels,
  getThumbnailUrl,
  getPreviewUrl,
  prefetchPreview,
  renderSidebar,
}: PhotoViewerProps<T>) {
  const currentItem = items[currentIndex]
  const viewerAreaRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return

      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
        onIndexChange(currentIndex - 1)
      } else if (
        event.key === 'ArrowRight' &&
        currentIndex < items.length - 1
      ) {
        onIndexChange(currentIndex + 1)
      }
    },
    [currentIndex, items.length, onClose, onIndexChange, open]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!open) return

    for (const offset of [-1, 0, 1]) {
      const item = items[currentIndex + offset]
      if (item) {
        prefetchPreview?.(item)
        void getThumbnailUrl(item)
      }
    }
  }, [currentIndex, getThumbnailUrl, items, open, prefetchPreview])

  if (!open || !currentItem) return null

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-black">
      <div
        ref={viewerAreaRef}
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <ViewerBlurBackground
          item={currentItem}
          getThumbnailUrl={getThumbnailUrl}
        />
        <div className="group relative min-h-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            title={labels.closeViewer}
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={() => onIndexChange(currentIndex - 1)}
            disabled={currentIndex <= 0}
            className={`left-2 ${NAV_BTN_CLASS}`}
            title={labels.prevPhoto}
          >
            <ChevronLeft size={24} />
          </button>

          <ViewerPhotoImage
            item={currentItem}
            loadFailedLabel={labels.previewLoadFailed}
            getPreviewUrl={getPreviewUrl}
          />

          <button
            type="button"
            onClick={() => onIndexChange(currentIndex + 1)}
            disabled={currentIndex >= items.length - 1}
            className={`right-2 ${NAV_BTN_CLASS}`}
            title={labels.nextPhoto}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {items.length > 1 && (
          <ThumbnailStrip
            items={items}
            currentIndex={currentIndex}
            boundsRef={viewerAreaRef}
            onSelect={onIndexChange}
            getThumbnailUrl={getThumbnailUrl}
            getPreviewUrl={getPreviewUrl}
            prefetchPreview={prefetchPreview}
          />
        )}
      </div>

      {renderSidebar?.(currentItem)}
    </div>
  )
}

export type {
  PhotoViewerItem,
  PhotoViewerLabels,
  PhotoViewerProps,
} from './types'
