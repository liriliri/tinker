import type { PreviewResult } from '../../common/types'

const previewUrlCache = new Map<string, Promise<PreviewResult | null>>()

export function getPhotoPreview(
  filePath: string
): Promise<PreviewResult | null> {
  const cached = previewUrlCache.get(filePath)
  if (cached) return cached

  const promise = photoViewer.getPreviewUrl(filePath).catch(() => null)
  previewUrlCache.set(filePath, promise)
  return promise
}

export function prefetchPhotoPreview(filePath: string) {
  void getPhotoPreview(filePath)
}

export function clearPhotoPreviewCache(filePath?: string) {
  if (filePath) {
    previewUrlCache.delete(filePath)
    return
  }
  previewUrlCache.clear()
}
