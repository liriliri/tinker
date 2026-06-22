import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { clampHoverPreviewX, getImageAspectRatio } from '../../lib/viewerLayout'
import type { PhotoViewerItem } from './types'

const PREVIEW_WIDTH = 320
const PREVIEW_GAP = 8

export interface ThumbnailHoverPreviewProps<T extends PhotoViewerItem> {
  item: T
  anchorRect: DOMRect
  boundsRect: DOMRect
  getPreviewUrl: (item: T) => Promise<string | null>
  getThumbnailUrl: (item: T) => Promise<string | null>
}

function ThumbnailHoverPreview<T extends PhotoViewerItem>({
  item,
  anchorRect,
  boundsRect,
  getPreviewUrl,
  getThumbnailUrl,
}: ThumbnailHoverPreviewProps<T>) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSrc(null)

    const load = async () => {
      const preview = await getPreviewUrl(item)
      if (cancelled) return
      if (preview) {
        setSrc(preview)
        return
      }

      const thumbnail = await getThumbnailUrl(item)
      if (cancelled || !thumbnail) return
      setSrc(thumbnail)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [getPreviewUrl, getThumbnailUrl, item.id])

  const aspectRatio = getImageAspectRatio(item.width, item.height)
  const previewHeight = PREVIEW_WIDTH / aspectRatio
  const left = clampHoverPreviewX(anchorRect, boundsRect, PREVIEW_WIDTH)
  const previewTop = Math.max(
    boundsRect.top + 8,
    anchorRect.top - PREVIEW_GAP - previewHeight
  )
  const bottom = window.innerHeight - previewTop - previewHeight

  return createPortal(
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left,
        bottom,
        width: PREVIEW_WIDTH,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className="relative overflow-hidden rounded-sm shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
        style={{ aspectRatio }}
      >
        {src ? (
          <img
            src={src}
            alt={item.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-white/10" />
        )}

        {item.title ? (
          <div
            className="absolute inset-x-0 bottom-0 p-3"
            style={{
              backgroundImage:
                'linear-gradient(to top, rgb(0 0 0 / 0.6), transparent)',
            }}
          >
            <div className="truncate text-sm font-medium text-white">
              {item.title}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

export default memo(ThumbnailHoverPreview) as typeof ThumbnailHoverPreview
