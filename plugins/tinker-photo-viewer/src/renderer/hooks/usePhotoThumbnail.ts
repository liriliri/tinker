import { useEffect, useState } from 'react'
import { getPhotoThumbnail } from '../lib/image'
import store from '../store'

export function usePhotoThumbnail(path: string, enabled = true) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setFailed(false)
    setSrc(null)

    getPhotoThumbnail(path).then((result) => {
      if (cancelled) return
      if (result?.url) {
        setSrc(result.url)
        store.updatePhotoFromThumbnail(
          path,
          result.width,
          result.height,
          result.takenAt
        )
      } else {
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [path, enabled])

  return { src, failed }
}
