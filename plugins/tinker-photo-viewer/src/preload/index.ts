import { contextBridge } from 'electron'
import type {
  PhotoMeta,
  PhotoExif,
  PreviewResult,
  ThumbnailResult,
} from '../common/types'
import {
  buildPreviewResult,
  buildThumbnailResult,
  resolvePreviewRequest,
  resolveThumbnailCache,
} from './image'
import { readExifFromFile, readPhotoMeta } from './photo'
import { scanPhotoFiles } from './scan'

const api = {
  async scanPhotoFiles(dirs: string[]) {
    return scanPhotoFiles(dirs)
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

contextBridge.exposeInMainWorld('photoViewer', api)

declare global {
  const photoViewer: typeof api
}
