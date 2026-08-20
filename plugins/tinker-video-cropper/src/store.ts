import { makeAutoObservable, runInAction } from 'mobx'
import fileUrl from 'licia/fileUrl'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/store/Base'
import { joinPath } from 'share/lib/util'
import { createMcpApi } from './mcp'
import { buildCropFfmpegArgs, normalizeCropRegion } from './lib/crop'
import { VIDEO_FILE_FILTER } from './lib/util'
import type { CropRegion, VideoInfo } from './types'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  video: VideoInfo | null = null
  isExporting = false
  progress = 0

  aspectRatio: number | null = null
  cropX = 0
  cropY = 0
  cropBoxWidth = 0
  cropBoxHeight = 0
  cropSyncToken = 0

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setAspectRatio(ratio: number | null) {
    if (this.isExporting) return
    this.aspectRatio = ratio
  }

  setCropBox(region: CropRegion) {
    if (this.isExporting) return
    this.cropX = Math.round(region.x)
    this.cropY = Math.round(region.y)
    this.cropBoxWidth = Math.round(region.width)
    this.cropBoxHeight = Math.round(region.height)
  }

  setCropRegion(region: CropRegion) {
    if (!this.video || this.isExporting) return
    this.setCropBox(
      normalizeCropRegion(region, this.video.width, this.video.height)
    )
    this.cropSyncToken += 1
  }

  async openVideoDialog() {
    if (this.isExporting) return
    const result = await tinker.showOpenDialog({
      title: 'Open Video',
      properties: ['openFile'],
      filters: [VIDEO_FILE_FILTER],
    })
    if (result.canceled || !result.filePaths[0]) return
    await this.loadVideo(result.filePaths[0])
  }

  async loadVideo(filePath: string) {
    const info = await tinker.getMediaInfo(filePath)
    if (!info.videoStream) {
      throw new Error('File has no video stream')
    }

    const { name } = splitPath(filePath)
    this.video = {
      filePath,
      fileName: name,
      src: `${fileUrl(filePath)}?t=${Date.now()}`,
      width: info.videoStream.width,
      height: info.videoStream.height,
      duration: info.duration,
      size: info.size,
    }
    this.aspectRatio = null
    this.cropX = 0
    this.cropY = 0
    this.cropBoxWidth = info.videoStream.width
    this.cropBoxHeight = info.videoStream.height
    this.cropSyncToken += 1
    this.progress = 0
    tinker.setTitle(name)
  }

  async exportVideo(outputPath?: string) {
    if (!this.video || this.isExporting) return

    let savePath = outputPath
    if (!savePath) {
      const result = await tinker.showSaveDialog({
        defaultPath: this.video.fileName.replace(/\.[^.]+$/, '-cropped$&'),
        filters: [VIDEO_FILE_FILTER],
      })
      if (result.canceled || !result.filePath) return
      savePath = result.filePath
    }

    const region = normalizeCropRegion(
      {
        x: this.cropX,
        y: this.cropY,
        width: this.cropBoxWidth,
        height: this.cropBoxHeight,
      },
      this.video.width,
      this.video.height
    )
    this.cropX = region.x
    this.cropY = region.y
    this.cropBoxWidth = region.width
    this.cropBoxHeight = region.height

    this.isExporting = true
    this.progress = 0

    try {
      const tmpDir = await tinker.getPath('temp')
      const { ext } = splitPath(this.video.filePath)
      const tmpPath = joinPath(
        tmpDir,
        `tinker-video-crop-${Date.now()}${ext || '.mp4'}`
      )
      const overwrite = savePath === this.video.filePath
      const encodePath = overwrite ? tmpPath : savePath

      await tinker.runFFmpeg(
        buildCropFfmpegArgs(this.video.filePath, encodePath, region),
        (progress) => {
          runInAction(() => {
            if (progress.percent !== undefined) {
              this.progress = Math.min(99, Math.round(progress.percent))
            }
          })
        }
      )

      if (overwrite) {
        await tinker.runFFmpeg(['-y', '-i', tmpPath, '-c', 'copy', savePath])
        await tinker.rm(tmpPath)
      }

      await this.loadVideo(savePath)
      return savePath
    } finally {
      runInAction(() => {
        this.isExporting = false
      })
    }
  }

  get hasVideo() {
    return this.video !== null
  }

  get originalAspectRatio() {
    if (!this.video) return null
    return this.video.width / this.video.height
  }
}

export default new Store()
