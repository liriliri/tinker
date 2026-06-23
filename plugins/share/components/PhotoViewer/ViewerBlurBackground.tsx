import { memo, useEffect, useRef, useState } from 'react'
import type { PhotoViewerItem } from './types'

interface ViewerBlurBackgroundProps<T extends PhotoViewerItem> {
  item: T
  getThumbnailUrl: (item: T) => Promise<string | null>
}

const BLUR_IMG_CLASS =
  'absolute inset-0 h-full w-full scale-110 object-cover blur-3xl transition-opacity duration-500'

function ViewerBlurBackground<T extends PhotoViewerItem>({
  item,
  getThumbnailUrl,
}: ViewerBlurBackgroundProps<T>) {
  const [layer0, setLayer0] = useState<string | null>(null)
  const [layer1, setLayer1] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const activeUrlRef = useRef<string | null>(null)
  const activeLayerRef = useRef<0 | 1>(0)

  useEffect(() => {
    let cancelled = false

    void getThumbnailUrl(item).then((url) => {
      if (cancelled || !url || url === activeUrlRef.current) return

      const img = new Image()
      img.onload = () => {
        if (cancelled || url === activeUrlRef.current) return

        const nextLayer = activeLayerRef.current === 0 ? 1 : 0
        if (nextLayer === 0) {
          setLayer0(url)
        } else {
          setLayer1(url)
        }

        activeLayerRef.current = nextLayer
        activeUrlRef.current = url
        setActiveLayer(nextLayer)
      }
      img.src = url
    })

    return () => {
      cancelled = true
    }
  }, [getThumbnailUrl, item])

  const layers = [layer0, layer1] as const

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {layers.map((src, index) =>
        src ? (
          <img
            key={index}
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className={`${BLUR_IMG_CLASS} ${
              activeLayer === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null
      )}
    </div>
  )
}

export default memo(ViewerBlurBackground) as typeof ViewerBlurBackground
