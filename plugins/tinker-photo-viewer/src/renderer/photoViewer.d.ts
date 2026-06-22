declare global {
  const photoViewer: {
    scanPhotoFiles(dirs: string[]): Promise<string[]>
    readPhotoMeta(
      filePath: string
    ): Promise<import('../common/types').PhotoMeta>
    readPhotoExif(
      filePath: string
    ): Promise<import('../common/types').PhotoExif | undefined>
    resolveThumbnailCache(
      filePath: string
    ): Promise<{ cachePath: string; exists: boolean }>
    buildThumbnailResult(
      filePath: string,
      cachePath: string,
      readTakenAt: boolean
    ): Promise<import('../common/types').ThumbnailResult>
    resolvePreviewRequest(
      filePath: string
    ): Promise<
      | { kind: 'native'; url: string }
      | { kind: 'convert'; cachePath: string; exists: boolean }
    >
    buildPreviewResult(
      cachePath: string
    ): Promise<import('../common/types').PreviewResult>
  }
}

export {}
