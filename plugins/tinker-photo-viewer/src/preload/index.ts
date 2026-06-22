import { contextBridge } from 'electron'
import type {
  PhotoMeta,
  PhotoExif,
  PreviewResult,
  ThumbnailResult,
} from '../common/types'
import { readExifFromFile } from './exif'
import { readPhotoMeta } from './meta'
import { getPreviewResult } from './preview'
import { scanPhotoFiles } from './scan'
import { getThumbnailResult } from './thumbnail'

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

  async getThumbnailUrl(filePath: string): Promise<ThumbnailResult> {
    return getThumbnailResult(filePath)
  },

  async getPreviewUrl(filePath: string): Promise<PreviewResult> {
    return getPreviewResult(filePath)
  },
}

contextBridge.exposeInMainWorld('photoViewer', photoViewerObj)
