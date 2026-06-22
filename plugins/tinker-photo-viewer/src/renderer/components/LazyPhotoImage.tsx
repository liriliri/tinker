import { memo, useEffect, useRef, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { tw } from 'share/theme'
import { useInView } from '../hooks/useInView'
import { usePhotoThumbnail } from '../hooks/usePhotoThumbnail'

interface LazyPhotoImageProps {
  path: string
  alt: string
  className?: string
  root?: Element | null
}

const LazyPhotoImage = memo(function LazyPhotoImage({
  path,
  alt,
  className = '',
  root,
}: LazyPhotoImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { root, rootMargin: '400px' })
  const { src, failed } = usePhotoThumbnail(path, inView)
  const [loadError, setLoadError] = useState(false)
  const hasFailed = failed || loadError

  useEffect(() => {
    setLoadError(false)
  }, [path])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      {src && !hasFailed ? (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setLoadError(true)}
        />
      ) : hasFailed ? (
        <div
          className={`absolute inset-0 flex items-center justify-center ${tw.bg.secondary}`}
        >
          <ImageOff size={24} className={tw.text.tertiary} />
        </div>
      ) : null}
    </div>
  )
})

export default LazyPhotoImage
