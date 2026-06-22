declare global {
  const photoViewer: {
    scanPhotoFiles(dirs: string[]): Promise<string[]>
    readPhotoMeta(
      filePath: string
    ): Promise<import('../common/types').PhotoMeta>
    getThumbnailUrl(
      filePath: string
    ): Promise<import('../common/types').ThumbnailResult>
    getPreviewUrl(
      filePath: string
    ): Promise<import('../common/types').PreviewResult>
  }
}

export {}
