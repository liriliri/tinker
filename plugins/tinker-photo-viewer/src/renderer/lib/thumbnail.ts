import type { ThumbnailResult } from '../../common/types'

const thumbUrlCache = new Map<string, Promise<ThumbnailResult | null>>()

export function getPhotoThumbnail(
  filePath: string
): Promise<ThumbnailResult | null> {
  const cached = thumbUrlCache.get(filePath)
  if (cached) return cached

  const promise = photoViewer.getThumbnailUrl(filePath).catch(() => null)
  thumbUrlCache.set(filePath, promise)
  return promise
}

export function clearPhotoThumbnailCache(filePath?: string) {
  if (filePath) {
    thumbUrlCache.delete(filePath)
    return
  }
  thumbUrlCache.clear()
}
