import { memo } from 'react'
import { usePhotoThumbnail } from '../hooks/usePhotoThumbnail'

interface ViewerThumbnailProps {
  path: string
  alt: string
  className?: string
}

const ViewerThumbnail = memo(function ViewerThumbnail({
  path,
  alt,
  className = '',
}: ViewerThumbnailProps) {
  const { src } = usePhotoThumbnail(path)

  if (!src) {
    return <div className={`h-full w-full bg-white/10 ${className}`} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
    />
  )
})

export default ViewerThumbnail
