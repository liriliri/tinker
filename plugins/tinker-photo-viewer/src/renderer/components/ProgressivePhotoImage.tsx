import { ImageOff, Loader2 } from 'lucide-react'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { getPhotoPreview } from '../lib/preview'
import { getPhotoThumbnail } from '../lib/thumbnail'
import ZoomPanImage from './ZoomPanImage'

interface ProgressivePhotoImageProps {
  path: string
  alt: string
}

const loadedThumbnailSet = new Set<string>()

const ProgressivePhotoImage = memo(function ProgressivePhotoImage({
  path,
  alt,
}: ProgressivePhotoImageProps) {
  const { t } = useTranslation()
  const thumbnailRef = useRef<HTMLImageElement>(null)
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null)
  const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [highResLoaded, setHighResLoaded] = useState(false)
  const [isHighResRendered, setIsHighResRendered] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setThumbnailSrc(null)
    setIsThumbnailLoaded(false)
    setPreviewSrc(null)
    setHighResLoaded(false)
    setIsHighResRendered(false)
    setFailed(false)

    let cancelled = false

    getPhotoThumbnail(path).then((result) => {
      if (cancelled || !result?.url) return
      setThumbnailSrc(result.url)
    })

    getPhotoPreview(path).then((result) => {
      if (cancelled) return
      if (result?.url) {
        setPreviewSrc(result.url)
        setHighResLoaded(true)
      } else {
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [path])

  useLayoutEffect(() => {
    if (!thumbnailSrc) {
      setIsThumbnailLoaded(false)
      return
    }

    if (loadedThumbnailSet.has(thumbnailSrc)) {
      setIsThumbnailLoaded(true)
      return
    }

    const thumbnail = thumbnailRef.current
    if (thumbnail?.complete && thumbnail.naturalWidth > 0) {
      loadedThumbnailSet.add(thumbnailSrc)
      setIsThumbnailLoaded(true)
      return
    }

    setIsThumbnailLoaded(false)
  }, [thumbnailSrc])

  const handleThumbnailLoad = useCallback(() => {
    if (thumbnailSrc) loadedThumbnailSet.add(thumbnailSrc)
    setIsThumbnailLoaded(true)
  }, [thumbnailSrc])

  const handlePreviewLoad = useCallback(() => {
    setIsHighResRendered(true)
  }, [])

  const handlePreviewError = useCallback(() => {
    setFailed(true)
  }, [])

  const showPreview = previewSrc && !failed
  const showLoading = !failed && (!highResLoaded || !isHighResRendered)

  return (
    <div className="relative h-full w-full overflow-hidden">
      {thumbnailSrc && (!isHighResRendered || failed) && (
        <img
          ref={thumbnailRef}
          src={thumbnailSrc}
          alt={alt}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            isThumbnailLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleThumbnailLoad}
        />
      )}

      {showPreview && (
        <ZoomPanImage
          key={previewSrc}
          src={previewSrc}
          alt={alt}
          highResLoaded={isHighResRendered}
          onLoad={handlePreviewLoad}
          onError={handlePreviewError}
        />
      )}

      {showLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-white/70" />
        </div>
      )}

      {failed && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${tw.text.tertiary}`}
        >
          <ImageOff size={32} className="text-white/60" />
          <span className="text-sm text-white/70">
            {t('previewLoadFailed')}
          </span>
        </div>
      )}
    </div>
  )
})

export default ProgressivePhotoImage
