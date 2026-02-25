import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import clamp from 'licia/clamp'
import splitPath from 'licia/splitPath'
import type {
  MediaItem,
  MediaType,
  AudioInfo,
  VideoCompressionMode,
  AudioCompressionMode,
} from './types'
import BaseStore from 'share/BaseStore'
import {
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  VIDEO_CRF_PRESETS,
  VIDEO_QUALITY_PERCENTAGES,
  AUDIO_BITRATE_PRESETS,
  AUDIO_SAMPLERATE_PRESETS,
  AUDIO_SAMPLERATE_BITRATES,
} from './lib/constants'
import { buildFFmpegArgs } from './lib/ffmpegArgs'
import { detectGpuEncoder } from './lib/gpuDetect'

export {
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  VIDEO_CRF_PRESETS,
  VIDEO_QUALITY_PERCENTAGES,
  AUDIO_BITRATE_PRESETS,
  AUDIO_SAMPLERATE_PRESETS,
  AUDIO_SAMPLERATE_BITRATES,
}

const STORAGE_KEY_QUALITY = 'quality'
const STORAGE_KEY_OUTPUT_DIR = 'outputDir'
const STORAGE_KEY_MODE = 'mode'
const STORAGE_KEY_VIDEO_MODE = 'videoMode'
const STORAGE_KEY_AUDIO_MODE = 'audioMode'
const storage = new LocalStore('tinker-media-compressor')

class Store extends BaseStore {
  videoItems: MediaItem[] = []
  audioItems: MediaItem[] = []
  quality: number = 2
  outputDir: string = ''
  mode: MediaType = 'video'
  videoCompressionMode: VideoCompressionMode = 'crf'
  audioCompressionMode: AudioCompressionMode = 'bitrate'

  private currentTask: ReturnType<typeof tinker.runFFmpeg> | null = null
  private cancelRequested = false
  private sizeUpdateCount = new Map<string, number>()

  get items(): MediaItem[] {
    return this.mode === 'video' ? this.videoItems : this.audioItems
  }

  constructor() {
    super()
    makeAutoObservable(this, {
      currentTask: false,
      cancelRequested: false,
      sizeUpdateCount: false,
    } as any)
    this.init()
  }

  private init() {
    this.loadQuality()
    this.loadOutputDir()
    this.loadMode()
    this.loadVideoMode()
    this.loadAudioMode()
  }

  private loadQuality() {
    const saved = storage.get(STORAGE_KEY_QUALITY)
    if (saved != null) {
      const q = clamp(toNum(saved), 0, 4)
      if (!isNaN(q)) {
        this.quality = q
      }
    }
  }

  private loadOutputDir() {
    const saved = storage.get(STORAGE_KEY_OUTPUT_DIR)
    if (saved !== null) {
      this.outputDir = saved
    }
  }

  private loadMode() {
    const saved = storage.get(STORAGE_KEY_MODE)
    if (saved === 'video' || saved === 'audio') {
      this.mode = saved
    }
  }

  private loadVideoMode() {
    const saved = storage.get(STORAGE_KEY_VIDEO_MODE)
    if (saved === 'crf' || saved === 'bitrate' || saved === 'resolution') {
      this.videoCompressionMode = saved
    }
  }

  private loadAudioMode() {
    const saved = storage.get(STORAGE_KEY_AUDIO_MODE)
    if (saved === 'bitrate' || saved === 'samplerate') {
      this.audioCompressionMode = saved
    }
  }

  setMode(mode: MediaType) {
    this.mode = mode
    storage.set(STORAGE_KEY_MODE, mode)
  }

  setVideoCompressionMode(mode: VideoCompressionMode) {
    this.videoCompressionMode = mode
    storage.set(STORAGE_KEY_VIDEO_MODE, mode)
  }

  setAudioCompressionMode(mode: AudioCompressionMode) {
    this.audioCompressionMode = mode
    storage.set(STORAGE_KEY_AUDIO_MODE, mode)
  }

  setQuality(quality: number) {
    this.quality = clamp(quality, 0, 4)
    storage.set(STORAGE_KEY_QUALITY, String(this.quality))
  }

  setOutputDir(dir: string) {
    // Remove trailing slashes to normalize
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

  private detectMediaType(filePath: string): MediaType {
    const { ext } = splitPath(filePath)
    if (VIDEO_EXTENSIONS.has(ext.toLowerCase())) return 'video'
    return 'audio'
  }

  getOutputPath(item: MediaItem): string {
    const { dir, name, ext } = splitPath(item.filePath)
    const baseName = ext ? name.slice(0, -ext.length) : name

    if (this.outputDir) {
      return `${this.outputDir}/${baseName}${ext}`
    }

    return `${dir}${baseName}_compressed${ext}`
  }

  async openMediaDialog() {
    try {
      const filters =
        this.mode === 'video'
          ? [
              {
                name: 'Video',
                extensions: [...VIDEO_EXTENSIONS].map((e) => e.slice(1)),
              },
            ]
          : [
              {
                name: 'Audio',
                extensions: [...AUDIO_EXTENSIONS].map((e) => e.slice(1)),
              },
            ]

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
    // Skip duplicates
    if (this.items.some((i) => i.filePath === filePath)) return

    const mediaType = this.detectMediaType(filePath)
    if (mediaType !== this.mode) return

    const { name } = splitPath(filePath)

    const item: MediaItem = {
      id: `${Date.now()}-${Math.random()}`,
      fileName: name,
      filePath,
      mediaType,
      originalSize: fileSize || 0,
      outputSize: 0,
      currentSize: 0,
      estimatedSize: 0,
      progress: 0,
      isCompressing: false,
      isDone: false,
      outputPath: null,
      error: null,
      videoInfo: undefined,
      audioInfo: undefined,
    }

    this.items.push(item)

    try {
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
    } catch (err) {
      console.error('Failed to get media info:', err)
    }
  }

  async compressAll() {
    this.cancelRequested = false
    for (const item of this.items) {
      if (this.cancelRequested) break
      if (!item.isDone && !item.isCompressing) {
        await this.compressItem(item.id)
      }
    }
  }

  async compressItem(id: string) {
    const item = this.items.find((i) => i.id === id)
    if (!item || item.isCompressing || item.isDone) return

    item.isCompressing = true
    item.progress = 0

    try {
      const outputPath = this.getOutputPath(item)
      const gpuEncoder = await detectGpuEncoder()
      const ffmpegArgs = buildFFmpegArgs(item, outputPath, {
        videoMode: this.videoCompressionMode,
        audioMode: this.audioCompressionMode,
        quality: this.quality,
        gpuEncoder,
      })

      const task = tinker.runFFmpeg(ffmpegArgs, (progress) => {
        runInAction(() => {
          if (progress.percent !== undefined) {
            item.progress = Math.min(99, Math.round(progress.percent))
          }
          if (
            progress.percent &&
            progress.percent > 0 &&
            progress.percent < 100 &&
            progress.size
          ) {
            const currentBytes = progress.size
            if (currentBytes > 0) {
              item.currentSize = currentBytes
              const count = (this.sizeUpdateCount.get(item.id) || 0) + 1
              this.sizeUpdateCount.set(item.id, count)
              if (count % 10 === 0) {
                item.estimatedSize = Math.round(
                  currentBytes / (progress.percent / 100)
                )
              }
            }
          }
        })
      })
      this.currentTask = task

      await (task as unknown as Promise<void>)
      this.currentTask = null

      const info = await tinker.getMediaInfo(outputPath)

      runInAction(() => {
        item.outputSize = info.size || 0
        item.progress = 100
        item.outputPath = outputPath
        item.isDone = true
        item.isCompressing = false

        if (item.mediaType === 'video' && info.videoStream) {
          item.compressedVideoInfo = {
            codec: info.videoStream.codec,
            width: info.videoStream.width,
            height: info.videoStream.height,
            fps: info.videoStream.fps,
            duration: info.duration,
            thumbnail: info.videoStream.thumbnail,
            bitrate: info.videoStream.bitrate,
          }
        } else if (item.mediaType === 'audio' && info.audioStream) {
          item.compressedAudioInfo = {
            duration: info.duration,
            codec: info.audioStream.codec,
            sampleRate: info.audioStream.sampleRate,
            bitrate: info.audioStream.bitrate,
          }
        }
      })
    } catch (err) {
      this.currentTask = null
      if (this.cancelRequested) {
        runInAction(() => {
          item.isCompressing = false
          item.progress = 0
        })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      console.error('Compression error:', message)
      runInAction(() => {
        item.error = message
        item.isCompressing = false
      })
    }
  }

  cancelCompression() {
    this.cancelRequested = true
    if (this.currentTask) {
      this.currentTask.quit()
      this.currentTask = null
    }
  }

  removeItem(id: string) {
    const index = this.items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }

  clear() {
    if (this.mode === 'video') {
      this.videoItems = []
    } else {
      this.audioItems = []
    }
  }

  get hasItems() {
    return this.items.length > 0
  }

  get hasUncompressed() {
    return this.items.some((i) => !i.isDone && !i.isCompressing)
  }

  get isCompressing() {
    return this.items.some((i) => i.isCompressing)
  }
}

export default new Store()
