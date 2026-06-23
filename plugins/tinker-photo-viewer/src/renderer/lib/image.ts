import { buildJpegScaleArgs } from '../../common/ffmpegImage'
import {
  PREVIEW_JPEG_QUALITY,
  PREVIEW_MAX_WIDTH,
  THUMB_JPEG_QUALITY,
  THUMB_MAX_WIDTH,
} from '../../common/imageConstants'
import type { PreviewResult, ThumbnailResult } from '../../common/types'
import { enqueue } from './util'

const previewUrlCache = new Map<string, Promise<PreviewResult | null>>()
const thumbUrlCache = new Map<string, Promise<ThumbnailResult | null>>()

async function ensureScaledCache(
  filePath: string,
  cachePath: string,
  exists: boolean,
  maxWidth: number,
  jpegQuality: number
) {
  if (exists) return
  await tinker.runFFmpeg(
    buildJpegScaleArgs(filePath, cachePath, maxWidth, jpegQuality)
  )
}

function getCached<T>(
  cache: Map<string, Promise<T | null>>,
  filePath: string,
  loader: (filePath: string) => Promise<T | null>
): Promise<T | null> {
  const cached = cache.get(filePath)
  if (cached) return cached

  const promise = loader(filePath).catch(() => null)
  cache.set(filePath, promise)
  return promise
}

function clearCached<T>(
  cache: Map<string, Promise<T | null>>,
  filePath?: string
) {
  if (filePath) {
    cache.delete(filePath)
    return
  }
  cache.clear()
}

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
    await ensureScaledCache(
      filePath,
      cachePath,
      exists,
      PREVIEW_MAX_WIDTH,
      PREVIEW_JPEG_QUALITY
    )
    return photoViewer.buildPreviewResult(cachePath)
  })
}

export function getPhotoPreview(
  filePath: string
): Promise<PreviewResult | null> {
  return getCached(previewUrlCache, filePath, loadPhotoPreview)
}

export function prefetchPhotoPreview(filePath: string) {
  void getPhotoPreview(filePath)
}

export function clearPhotoPreviewCache(filePath?: string) {
  clearCached(previewUrlCache, filePath)
}

async function loadPhotoThumbnail(
  filePath: string
): Promise<ThumbnailResult | null> {
  return enqueue(async () => {
    const { cachePath, exists } = await photoViewer.resolveThumbnailCache(
      filePath
    )
    await ensureScaledCache(
      filePath,
      cachePath,
      exists,
      THUMB_MAX_WIDTH,
      THUMB_JPEG_QUALITY
    )
    return photoViewer.buildThumbnailResult(filePath, cachePath, !exists)
  })
}

export function getPhotoThumbnail(
  filePath: string
): Promise<ThumbnailResult | null> {
  return getCached(thumbUrlCache, filePath, loadPhotoThumbnail)
}

export function clearPhotoThumbnailCache(filePath?: string) {
  clearCached(thumbUrlCache, filePath)
}
