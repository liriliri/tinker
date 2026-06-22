declare global {
  const photoViewer: {
    scanPhotoFiles(dirs: string[]): Promise<string[]>
    readPhotoMeta(
      filePath: string
    ): Promise<import('../common/types').PhotoMeta>
    readPhotoExif(
      filePath: string
    ): Promise<import('../common/types').PhotoExif | undefined>
    getThumbnailUrl(
      filePath: string
    ): Promise<import('../common/types').ThumbnailResult>
    getPreviewUrl(
      filePath: string
    ): Promise<import('../common/types').PreviewResult>
  }
}

export {}
