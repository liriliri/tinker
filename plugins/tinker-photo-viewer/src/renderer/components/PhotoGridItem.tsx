import { observer } from 'mobx-react-lite'
import { Camera, Circle, Clock } from 'lucide-react'
import { tw } from 'share/theme'
import { formatExifData, formatFileSize } from '../lib/photoMeta'
import type { Photo } from '../types'
import LazyPhotoImage from './LazyPhotoImage'

interface PhotoGridItemProps {
  photo: Photo
  scrollRoot: Element | null
  onOpen: (photo: Photo) => void
}

const PhotoGridItem = observer(function PhotoGridItem({
  photo,
  scrollRoot,
  onOpen,
}: PhotoGridItemProps) {
  const exifData = formatExifData(photo.exif)

  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className={`group relative block h-full w-full cursor-pointer overflow-hidden rounded-sm ${tw.bg.secondary}`}
    >
      <LazyPhotoImage path={photo.path} alt={photo.title} root={scrollRoot} />

      <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-left text-white">
        <h3 className="mb-1 truncate text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {photo.title}
        </h3>

        <div className="mb-2 flex flex-wrap gap-2 text-xs text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span>{photo.format}</span>
          <span>•</span>
          {photo.width > 0 && photo.height > 0 ? (
            <>
              <span>
                {photo.width} × {photo.height}
              </span>
              <span>•</span>
            </>
          ) : null}
          <span>{formatFileSize(photo.size)}</span>
        </div>

        {exifData && (
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {exifData.focalLength && (
              <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <Camera size={12} className="text-white/70" />
                <span>{exifData.focalLength}</span>
              </div>
            )}
            {exifData.aperture && (
              <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <Circle size={12} className="text-white/70" />
                <span>{exifData.aperture}</span>
              </div>
            )}
            {exifData.shutterSpeed && (
              <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <Clock size={12} className="text-white/70" />
                <span>{exifData.shutterSpeed}</span>
              </div>
            )}
            {exifData.iso && (
              <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-white/70 text-[10px]">ISO</span>
                <span>{exifData.iso}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  )
})

export default PhotoGridItem
