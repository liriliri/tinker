import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import contain from 'licia/contain'
import find from 'licia/find'
import loadImg from 'licia/loadImg'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import pluck from 'licia/pluck'
import promisify from 'licia/promisify'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import upperCase from 'licia/upperCase'
import i18n from 'i18next'
import type { MediaItem, MediaType, AudioInfo } from './types'
import BaseStore from 'share/store/Base'
import { VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS } from 'share/lib/fileType'
import {
  VIDEO_OUTPUT_FORMATS,
  AUDIO_OUTPUT_FORMATS,
  IMAGE_OUTPUT_FORMATS,
  FFPROBE_CODEC_MAP,
} from './lib/constants'
import { buildFFmpegArgs, getOutputPath } from './lib/ffmpegArgs'
import { detectMediaType, resolveMediaMode } from './lib/mediaType'
import { createMcpApi } from './mcp'

const STORAGE_OUTPUT_DIR = 'outputDir'
const STORAGE_MODE = 'mode'
const STORAGE_VIDEO_FORMAT = 'videoFormat'
const STORAGE_AUDIO_FORMAT = 'audioFormat'
const STORAGE_IMAGE_FORMAT = 'imageFormat'
const storage = new LocalStore('tinker-media-converter')

const loadImage = promisify(loadImg) as (
  src: string
) => Promise<HTMLImageElement>

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  videoItems: MediaItem[] = []
  audioItems: MediaItem[] = []
  imageItems: MediaItem[] = []
  outputDir: string = ''
  mode: MediaType = 'video'
  videoOutputFormat: string = VIDEO_OUTPUT_FORMATS[0].value
  audioOutputFormat: string = AUDIO_OUTPUT_FORMATS[0]
  imageOutputFormat: string = IMAGE_OUTPUT_FORMATS[0]

  private currentTask: ReturnType<typeof tinker.runFFmpeg> | null = null
  private cancelRequested = false
  private isBatchConverting = false

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

  get outputFormatOptions(): { label: string; value: string }[] {
    if (this.mode === 'video') {
      return map(VIDEO_OUTPUT_FORMATS, (f) => ({
        label: f.label,
        value: f.value,
      }))
    }
    if (this.mode === 'audio') {
      return map(AUDIO_OUTPUT_FORMATS, (f) => ({
        label: upperCase(f),
        value: f,
      }))
    }
    return map(IMAGE_OUTPUT_FORMATS, (f) => ({
      label: upperCase(f),
      value: f,
    }))
  }

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      currentTask: false,
      cancelRequested: false,
    } as Record<string, false>)
    this.loadStorage()
  }

  private loadStorage() {
    this.loadOutputDir()
    this.loadMode()
    this.loadVideoFormat()
    this.loadAudioFormat()
    this.loadImageFormat()
  }

  private loadOutputDir() {
    const saved = storage.get(STORAGE_OUTPUT_DIR)
    if (saved !== null) {
      this.outputDir = saved
    }
  }

  private loadMode() {
    const saved = storage.get(STORAGE_MODE)
    if (saved === 'video' || saved === 'audio' || saved === 'image') {
      this.mode = saved
    }
  }

  private loadVideoFormat() {
    const saved = storage.get(STORAGE_VIDEO_FORMAT)
    if (saved && contain(pluck(VIDEO_OUTPUT_FORMATS, 'value'), saved)) {
      this.videoOutputFormat = saved
    }
  }

  private loadAudioFormat() {
    const saved = storage.get(STORAGE_AUDIO_FORMAT)
    if (saved && contain(AUDIO_OUTPUT_FORMATS, saved)) {
      this.audioOutputFormat = saved
    }
  }

  private loadImageFormat() {
    const saved = storage.get(STORAGE_IMAGE_FORMAT)
    if (saved && contain(IMAGE_OUTPUT_FORMATS, saved)) {
      this.imageOutputFormat = saved
    }
  }

  setMode(mode: MediaType) {
    this.mode = mode
    storage.set(STORAGE_MODE, mode)
  }

  setOutputFormat(format: string) {
    if (this.mode === 'video') {
      this.videoOutputFormat = format
      storage.set(STORAGE_VIDEO_FORMAT, format)
    } else if (this.mode === 'audio') {
      this.audioOutputFormat = format
      storage.set(STORAGE_AUDIO_FORMAT, format)
    } else {
      this.imageOutputFormat = format
      storage.set(STORAGE_IMAGE_FORMAT, format)
    }
  }

  setOutputDir(dir: string) {
    this.outputDir = dir.replace(/[/\\]+$/, '')
    storage.set(STORAGE_OUTPUT_DIR, this.outputDir)
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

  async openMediaDialog() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          {
            name: i18n.t('media'),
            extensions: [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS],
          },
          {
            name: i18n.t('video'),
            extensions: [...VIDEO_EXTS],
          },
          {
            name: i18n.t('audio'),
            extensions: [...AUDIO_EXTS],
          },
          {
            name: i18n.t('image'),
            extensions: [...IMAGE_EXTS],
          },
        ],
        properties: ['openFile', 'multiSelections'],
      })

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return
      }

      await this.loadMediaFiles(result.filePaths)
    } catch (err) {
      console.error('Failed to open media:', err)
      throw err
    }
  }

  async loadMediaFiles(
    filePaths: string[],
    fileSizes?: Record<string, number>
  ) {
    const mode = resolveMediaMode(filePaths)
    if (mode !== this.mode) {
      this.setMode(mode)
    }

    for (const filePath of filePaths) {
      await this.loadMedia(filePath, fileSizes?.[filePath])
    }
  }

  async loadMedia(filePath: string, fileSize?: number) {
    if (this.items.some((i) => i.filePath === filePath)) return

    const mediaType = detectMediaType(filePath)
    if (!mediaType) return

    if (mediaType !== this.mode) {
      this.setMode(mediaType)
    }

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

        try {
          const img = await loadImage(url)
          if (img.naturalWidth > 0) {
            storedItem.imageInfo = {
              width: img.naturalWidth,
              height: img.naturalHeight,
              url,
            }
          } else {
            URL.revokeObjectURL(url)
          }
        } catch {
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
    this.isBatchConverting = true
    try {
      for (const item of this.items) {
        if (this.cancelRequested) break
        if (!item.isDone && !item.isConverting && this.isConvertible(item)) {
          await this.convertItem(item.id)
        }
      }
    } finally {
      runInAction(() => {
        this.isBatchConverting = false
      })
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
    const fileExt = lowerCase(ext.slice(1))
    if (this.mode === 'video') {
      const fmt = find(
        VIDEO_OUTPUT_FORMATS,
        (f) => f.value === this.videoOutputFormat
      )
      if (!fmt) return true
      if (fileExt !== fmt.ext) return true
      const fileCodec = item.videoInfo
        ? FFPROBE_CODEC_MAP[item.videoInfo.codec]
        : undefined
      return fileCodec !== fmt.codec
    }
    return fileExt !== this.outputFormat
  }

  get hasUnconverted() {
    return some(
      this.items,
      (i) => !i.isDone && !i.isConverting && this.isConvertible(i)
    )
  }

  get isConverting() {
    return this.isBatchConverting || some(this.items, (i) => i.isConverting)
  }
}

export default new Store()
