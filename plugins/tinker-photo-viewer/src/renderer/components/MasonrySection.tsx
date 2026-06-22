import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { layoutMasonryItems } from '../lib/masonryLayout'
import type { Photo } from '../types'
import PhotoGridItem from './PhotoGridItem'

interface MasonrySectionProps {
  photos: Photo[]
  containerWidth: number
  scrollRoot: Element | null
  onOpen: (photo: Photo) => void
}

const MasonrySection = observer(function MasonrySection({
  photos,
  containerWidth,
  scrollRoot,
  onOpen,
}: MasonrySectionProps) {
  const dimensionsKey = photos
    .map((photo) => `${photo.id}:${photo.width}x${photo.height}`)
    .join('|')

  const { layouts, totalHeight } = useMemo(
    () => layoutMasonryItems(photos, containerWidth),
    [photos, containerWidth, dimensionsKey]
  )

  const layoutMap = useMemo(() => {
    const map = new Map<string, (typeof layouts)[number]>()
    for (const layout of layouts) {
      map.set(layout.photoId, layout)
    }
    return map
  }, [layouts])

  if (photos.length === 0 || containerWidth <= 0) return null

  return (
    <div className="relative py-2 pl-2" style={{ height: totalHeight }}>
      {photos.map((photo) => {
        const layout = layoutMap.get(photo.id)
        if (!layout) return null

        return (
          <div
            key={photo.id}
            className="absolute"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.width,
              height: layout.height,
            }}
          >
            <PhotoGridItem
              photo={photo}
              scrollRoot={scrollRoot}
              onOpen={onOpen}
            />
          </div>
        )
      })}
    </div>
  )
})

export default MasonrySection
