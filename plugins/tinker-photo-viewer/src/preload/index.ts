import { contextBridge } from 'electron'
import type {
  PhotoMeta,
  PhotoExif,
  PreviewResult,
  ThumbnailResult,
} from '../common/types'
import { readExifFromFile } from './exif'
import { buildPreviewResult, buildThumbnailResult } from './imageProcessor'
import { readPhotoMeta } from './meta'
import { resolvePreviewRequest } from './preview'
import { scanPhotoFiles } from './scan'
import { resolveThumbnailCache } from './thumbnail'

const photoViewerObj = {
  async scanPhotoFiles(dirs: string[]) {
    const files = await scanPhotoFiles([...dirs])
    return [...files]
  },

  async readPhotoMeta(filePath: string): Promise<PhotoMeta> {
    return readPhotoMeta(filePath)
  },

  async readPhotoExif(filePath: string): Promise<PhotoExif | undefined> {
    return readExifFromFile(filePath)
  },

  async resolveThumbnailCache(filePath: string) {
    return resolveThumbnailCache(filePath)
  },

  async buildThumbnailResult(
    filePath: string,
    cachePath: string,
    readTakenAt: boolean
  ): Promise<ThumbnailResult> {
    return buildThumbnailResult(filePath, cachePath, readTakenAt)
  },

  async resolvePreviewRequest(filePath: string) {
    return resolvePreviewRequest(filePath)
  },

  async buildPreviewResult(cachePath: string): Promise<PreviewResult> {
    return buildPreviewResult(cachePath)
  },
}

contextBridge.exposeInMainWorld('photoViewer', photoViewerObj)
