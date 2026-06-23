import { ImageOff } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { LoadingCircle } from '../Loading'
import { tw } from '../../theme'
import type { PhotoViewerItem } from './types'
import ZoomPanImage from './ZoomPanImage'

interface ViewerPhotoImageProps<T extends PhotoViewerItem> {
  item: T
  loadFailedLabel: string
  getPreviewUrl: (item: T) => Promise<string | null>
}

function ViewerPhotoImage<T extends PhotoViewerItem>({
  item,
  loadFailedLabel,
  getPreviewUrl,
}: ViewerPhotoImageProps<T>) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setFailed(false)

    void getPreviewUrl(item).then((url) => {
      if (cancelled) return
      if (url) {
        setPreviewSrc(url)
      } else {
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [getPreviewUrl, item])

  const handleError = useCallback(() => {
    setFailed(true)
  }, [])

  const showPreview = previewSrc && !failed
  const showLoading = !failed && !previewSrc

  return (
    <div className="relative h-full w-full overflow-hidden">
      {showPreview && (
        <ZoomPanImage
          src={previewSrc}
          alt={item.title}
          naturalWidthHint={item.width}
          naturalHeightHint={item.height}
          onError={handleError}
        />
      )}

      {showLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <LoadingCircle className="!text-white/70 h-7 w-7" />
        </div>
      )}

      {failed && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${tw.text.tertiary}`}
        >
          <ImageOff size={32} className="text-white/60" />
          <span className="text-sm text-white/70">{loadFailedLabel}</span>
        </div>
      )}
    </div>
  )
}

export default memo(ViewerPhotoImage) as typeof ViewerPhotoImage
