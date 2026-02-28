import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { MediaItem, MediaType, AudioInfo } from './types'
import BaseStore from 'share/BaseStore'
import {
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_OUTPUT_FORMATS,
  AUDIO_OUTPUT_FORMATS,
  IMAGE_OUTPUT_FORMATS,
} from './lib/constants'
import { buildFFmpegArgs, getOutputPath } from './lib/ffmpegArgs'

const STORAGE_KEY_OUTPUT_DIR = 'outputDir'
const STORAGE_KEY_MODE = 'mode'
const STORAGE_KEY_VIDEO_FORMAT = 'videoFormat'
const STORAGE_KEY_AUDIO_FORMAT = 'audioFormat'
const STORAGE_KEY_IMAGE_FORMAT = 'imageFormat'
const storage = new LocalStore('tinker-media-converter')

class Store extends BaseStore {
  videoItems: MediaItem[] = []
  audioItems: MediaItem[] = []
  imageItems: MediaItem[] = []
  outputDir: string = ''
  mode: MediaType = 'video'
  videoOutputFormat: string = VIDEO_OUTPUT_FORMATS[0]
  audioOutputFormat: string = AUDIO_OUTPUT_FORMATS[0]
  imageOutputFormat: string = IMAGE_OUTPUT_FORMATS[0]

  private currentTask: ReturnType<typeof tinker.runFFmpeg> | null = null
  private cancelRequested = false

  get items(): MediaItem[] {
    if (this.mode === 'video') return this.videoItems
    if (this.mode === 'audio') return this.audioItems
    return this.imageItems
  }

  get outputFormat(): string {
    if (this.mode === 'video') return this.videoOutputFormat
    if (this.mode === 'audio') return this.audioOutputFormat
    return this.imageOutputFormat
  }

  get outputFormatOptions(): string[] {
    if (this.mode === 'video') return VIDEO_OUTPUT_FORMATS
    if (this.mode === 'audio') return AUDIO_OUTPUT_FORMATS
    return IMAGE_OUTPUT_FORMATS
  }

  constructor() {
    super()
    makeAutoObservable(this, {
      currentTask: false,
      cancelRequested: false,
    } as Record<string, false>)
    this.init()
  }

  private init() {
    this.loadOutputDir()
    this.loadMode()
    this.loadVideoFormat()
    this.loadAudioFormat()
    this.loadImageFormat()
  }

  private loadOutputDir() {
    const saved = storage.get(STORAGE_KEY_OUTPUT_DIR)
    if (saved !== null) {
      this.outputDir = saved
    }
  }

  private loadMode() {
    const saved = storage.get(STORAGE_KEY_MODE)
    if (saved === 'video' || saved === 'audio' || saved === 'image') {
      this.mode = saved
    }
  }

  private loadVideoFormat() {
    const saved = storage.get(STORAGE_KEY_VIDEO_FORMAT)
    if (saved && VIDEO_OUTPUT_FORMATS.includes(saved)) {
      this.videoOutputFormat = saved
    }
  }

  private loadAudioFormat() {
    const saved = storage.get(STORAGE_KEY_AUDIO_FORMAT)
    if (saved && AUDIO_OUTPUT_FORMATS.includes(saved)) {
      this.audioOutputFormat = saved
    }
  }

  private loadImageFormat() {
    const saved = storage.get(STORAGE_KEY_IMAGE_FORMAT)
    if (saved && IMAGE_OUTPUT_FORMATS.includes(saved)) {
      this.imageOutputFormat = saved
    }
  }

  setMode(mode: MediaType) {
    this.mode = mode
    storage.set(STORAGE_KEY_MODE, mode)
  }

  setOutputFormat(format: string) {
    if (this.mode === 'video') {
      this.videoOutputFormat = format
      storage.set(STORAGE_KEY_VIDEO_FORMAT, format)
    } else if (this.mode === 'audio') {
      this.audioOutputFormat = format
      storage.set(STORAGE_KEY_AUDIO_FORMAT, format)
    } else {
      this.imageOutputFormat = format
      storage.set(STORAGE_KEY_IMAGE_FORMAT, format)
    }
  }

  setOutputDir(dir: string) {
    this.outputDir = dir.replace(/[/\\]+$/, '')
    storage.set(STORAGE_KEY_OUTPUT_DIR, this.outputDir)
  }

  async browseOutputDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return
    }

    this.setOutputDir(result.filePaths[0])
  }

  private detectMediaType(filePath: string): MediaType | null {
    const { ext } = splitPath(filePath)
    const e = ext.toLowerCase()
    if (VIDEO_EXTENSIONS.has(e)) return 'video'
    if (AUDIO_EXTENSIONS.has(e)) return 'audio'
    if (IMAGE_EXTENSIONS.has(e)) return 'image'
    return null
  }

  async openMediaDialog() {
    try {
      let filters: { name: string; extensions: string[] }[]
      if (this.mode === 'video') {
        filters = [
          {
            name: 'Video',
            extensions: [...VIDEO_EXTENSIONS].map((e) => e.slice(1)),
          },
        ]
      } else if (this.mode === 'audio') {
        filters = [
          {
            name: 'Audio',
            extensions: [...AUDIO_EXTENSIONS].map((e) => e.slice(1)),
          },
        ]
      } else {
        filters = [
          {
            name: 'Image',
            extensions: [...IMAGE_EXTENSIONS].map((e) => e.slice(1)),
          },
        ]
      }

      const result = await tinker.showOpenDialog({
        filters,
        properties: ['openFile', 'multiSelections'],
      })

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return
      }

      for (const filePath of result.filePaths) {
        await this.loadMedia(filePath)
      }
    } catch (err) {
      console.error('Failed to open media:', err)
      throw err
    }
  }

  async loadMedia(filePath: string, fileSize?: number) {
    if (this.items.some((i) => i.filePath === filePath)) return

    const mediaType = this.detectMediaType(filePath)
    if (!mediaType || mediaType !== this.mode) return

    const { name } = splitPath(filePath)

    const item: MediaItem = {
      id: `${Date.now()}-${Math.random()}`,
      fileName: name,
      filePath,
      mediaType,
      originalSize: fileSize || 0,
      outputSize: 0,
      progress: 0,
      isConverting: false,
      isDone: false,
      outputPath: null,
      error: null,
    }

    this.items.push(item)

    try {
      if (mediaType === 'image') {
        const buffer = await tinker.readFile(filePath)
        const storedItem = this.items.find((i) => i.id === item.id)
        if (!storedItem) return

        if (!fileSize) {
          storedItem.originalSize = buffer.byteLength
        }

        const blob = new Blob([buffer])
        const url = URL.createObjectURL(blob)

        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          img.src = url
        })

        if (img.naturalWidth > 0) {
          storedItem.imageInfo = {
            width: img.naturalWidth,
            height: img.naturalHeight,
            url,
          }
        } else {
          URL.revokeObjectURL(url)
        }
      } else {
        const info = await tinker.getMediaInfo(filePath)
        const storedItem = this.items.find((i) => i.id === item.id)
        if (!storedItem) return

        if (!fileSize && info.size) {
          storedItem.originalSize = info.size
        }

        if (mediaType === 'video' && info.videoStream) {
          storedItem.videoInfo = {
            codec: info.videoStream.codec,
            width: info.videoStream.width,
            height: info.videoStream.height,
            fps: info.videoStream.fps,
            duration: info.duration,
            thumbnail: info.videoStream.thumbnail,
            bitrate: info.videoStream.bitrate,
          }
        } else if (mediaType === 'audio' && info.audioStream) {
          const audioInfo: AudioInfo = {
            duration: info.duration,
            codec: info.audioStream.codec,
            sampleRate: info.audioStream.sampleRate,
            bitrate: info.audioStream.bitrate,
          }
          storedItem.audioInfo = audioInfo
        }
      }
    } catch (err) {
      console.error('Failed to get media info:', err)
    }
  }

  async convertAll() {
    this.cancelRequested = false
    for (const item of this.items) {
      if (this.cancelRequested) break
      if (!item.isDone && !item.isConverting && this.isConvertible(item)) {
        await this.convertItem(item.id)
      }
    }
  }

  async convertItem(id: string) {
    const item = this.items.find((i) => i.id === id)
    if (!item || item.isConverting || item.isDone) return

    item.isConverting = true
    item.progress = 0

    try {
      const outputPath = await getOutputPath(
        item,
        this.outputDir,
        this.outputFormat
      )
      const ffmpegArgs = buildFFmpegArgs(item, outputPath, this.outputFormat)

      const task = tinker.runFFmpeg(ffmpegArgs, (progress) => {
        runInAction(() => {
          if (progress.percent !== undefined) {
            item.progress = Math.min(99, Math.round(progress.percent))
          }
        })
      })
      this.currentTask = task

      await (task as unknown as Promise<void>)
      this.currentTask = null

      let outputSize = 0
      if (item.mediaType === 'image') {
        const buffer = await tinker.readFile(outputPath)
        outputSize = buffer.byteLength
      } else {
        const info = await tinker.getMediaInfo(outputPath)
        outputSize = info.size || 0
      }

      runInAction(() => {
        item.outputSize = outputSize
        item.progress = 100
        item.outputPath = outputPath
        item.isDone = true
        item.isConverting = false
      })
    } catch (err) {
      this.currentTask = null
      if (this.cancelRequested) {
        runInAction(() => {
          item.isConverting = false
          item.progress = 0
        })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      console.error('Conversion error:', message)
      runInAction(() => {
        item.error = message
        item.isConverting = false
      })
    }
  }

  cancelConversion() {
    this.cancelRequested = true
    if (this.currentTask) {
      this.currentTask.quit()
      this.currentTask = null
    }
  }

  removeItem(id: string) {
    const index = this.items.findIndex((i) => i.id === id)
    if (index !== -1) {
      const item = this.items[index]
      if (item.imageInfo?.url) {
        URL.revokeObjectURL(item.imageInfo.url)
      }
      this.items.splice(index, 1)
    }
  }

  clear() {
    for (const item of this.items) {
      if (item.imageInfo?.url) {
        URL.revokeObjectURL(item.imageInfo.url)
      }
    }
    if (this.mode === 'video') {
      this.videoItems = []
    } else if (this.mode === 'audio') {
      this.audioItems = []
    } else {
      this.imageItems = []
    }
  }

  get hasItems() {
    return this.items.length > 0
  }

  isConvertible(item: MediaItem): boolean {
    const { ext } = splitPath(item.filePath)
    return ext.toLowerCase().slice(1) !== this.outputFormat
  }

  get hasUnconverted() {
    return this.items.some(
      (i) => !i.isDone && !i.isConverting && this.isConvertible(i)
    )
  }

  get isConverting() {
    return this.items.some((i) => i.isConverting)
  }
}

export default new Store()
