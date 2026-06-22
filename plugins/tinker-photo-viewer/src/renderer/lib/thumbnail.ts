import { buildJpegScaleArgs } from '../../common/ffmpegImage'
import type { ThumbnailResult } from '../../common/types'
import { enqueue } from './taskQueue'

const THUMB_MAX_WIDTH = 480
const THUMB_JPEG_QUALITY = 82

const thumbUrlCache = new Map<string, Promise<ThumbnailResult | null>>()

async function loadPhotoThumbnail(
  filePath: string
): Promise<ThumbnailResult | null> {
  return enqueue(async () => {
    const { cachePath, exists } = await photoViewer.resolveThumbnailCache(
      filePath
    )

    if (!exists) {
      await tinker.runFFmpeg(
        buildJpegScaleArgs(
          filePath,
          cachePath,
          THUMB_MAX_WIDTH,
          THUMB_JPEG_QUALITY
        )
      )
    }

    return photoViewer.buildThumbnailResult(filePath, cachePath, !exists)
  })
}

export function getPhotoThumbnail(
  filePath: string
): Promise<ThumbnailResult | null> {
  const cached = thumbUrlCache.get(filePath)
  if (cached) return cached

  const promise = loadPhotoThumbnail(filePath).catch(() => null)
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
