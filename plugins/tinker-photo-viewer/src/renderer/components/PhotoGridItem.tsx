import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import { formatFileSize } from '../lib/util'
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
  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className={`group relative block h-full w-full cursor-pointer overflow-hidden rounded-sm ${tw.bg.secondary}`}
    >
      <LazyPhotoImage path={photo.path} alt={photo.title} root={scrollRoot} />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {/* Do not change: inline gradient renders correctly; Tailwind classes do not match here */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to top, rgb(0 0 0 / 0.8), rgb(0 0 0 / 0.2), transparent)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 p-3 text-left text-white">
          <h3 className="mb-1 truncate text-sm font-medium">{photo.title}</h3>

          <div className="flex flex-wrap gap-2 text-xs text-white/80">
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
        </div>
      </div>
    </button>
  )
})

export default PhotoGridItem
