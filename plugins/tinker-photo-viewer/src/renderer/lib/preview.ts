import { buildJpegScaleArgs } from '../../common/ffmpegImage'
import type { PreviewResult } from '../../common/types'
import { enqueue } from './taskQueue'

const PREVIEW_MAX_WIDTH = 2560
const PREVIEW_JPEG_QUALITY = 88

const previewUrlCache = new Map<string, Promise<PreviewResult | null>>()

async function loadPhotoPreview(
  filePath: string
): Promise<PreviewResult | null> {
  const request = await photoViewer.resolvePreviewRequest(filePath)

  if (request.kind === 'native') {
    return {
      url: request.url,
      width: 0,
      height: 0,
    }
  }

  return enqueue(async () => {
    const { cachePath, exists } = request

    if (!exists) {
      await tinker.runFFmpeg(
        buildJpegScaleArgs(
          filePath,
          cachePath,
          PREVIEW_MAX_WIDTH,
          PREVIEW_JPEG_QUALITY
        )
      )
    }

    return photoViewer.buildPreviewResult(cachePath)
  })
}

export function getPhotoPreview(
  filePath: string
): Promise<PreviewResult | null> {
  const cached = previewUrlCache.get(filePath)
  if (cached) return cached

  const promise = loadPhotoPreview(filePath).catch(() => null)
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
