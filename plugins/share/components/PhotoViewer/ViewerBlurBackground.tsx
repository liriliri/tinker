import { memo, useEffect, useState } from 'react'

interface ViewerBlurBackgroundProps {
  getThumbnailUrl: () => Promise<string | null>
}

const ViewerBlurBackground = memo(function ViewerBlurBackground({
  getThumbnailUrl,
}: ViewerBlurBackgroundProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSrc(null)

    void getThumbnailUrl().then((url) => {
      if (!cancelled && url) setSrc(url)
    })

    return () => {
      cancelled = true
    }
  }, [getThumbnailUrl])

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-black/80">
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl transition-opacity duration-300"
        />
      )}
    </div>
  )
})

export default ViewerBlurBackground
