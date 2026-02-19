import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import clamp from 'licia/clamp'
import splitPath from 'licia/splitPath'
import type { MediaItem, MediaType } from './types'
import BaseStore from 'share/BaseStore'

const STORAGE_KEY_QUALITY = 'quality'
const STORAGE_KEY_OUTPUT_DIR = 'outputDir'
const storage = new LocalStore('tinker-media-compressor')

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm'])
const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.wav',
])

// Supported extensions for filtering
export const SUPPORTED_EXTENSIONS = new Set([
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
])

// CRF presets for H.264/VP9: lower value = higher quality
const VIDEO_CRF_PRESETS = [35, 28, 23, 18, 15]

// Audio bitrate presets
const AUDIO_BITRATE_PRESETS = ['64k', '96k', '128k', '192k', '320k']

class Store extends BaseStore {
  items: MediaItem[] = []
  quality: number = 2
  outputDir: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    this.loadQuality()
    this.loadOutputDir()
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

  private getOutputExt(ext: string): string {
    // Convert lossless audio formats to mp3 for lossy compression
    const lower = ext.toLowerCase()
    if (lower === '.flac' || lower === '.wav') return '.mp3'
    return lower
  }

  getOutputPath(item: MediaItem): string {
    const { dir, name, ext } = splitPath(item.filePath)
    // splitPath's name includes the extension, strip it for the base name
    const baseName = ext ? name.slice(0, -ext.length) : name
    const outputExt = this.getOutputExt(ext)

    if (this.outputDir) {
      return `${this.outputDir}/${baseName}${outputExt}`
    }

    // Same directory: add _compressed suffix to avoid overwriting original
    return `${dir}${baseName}_compressed${outputExt}`
  }

  private buildFFmpegArgs(item: MediaItem, outputPath: string): string[] {
    const { ext } = splitPath(item.filePath)
    const lowerExt = ext.toLowerCase()
    const args = ['-i', item.filePath]

    if (item.mediaType === 'video') {
      const crf = VIDEO_CRF_PRESETS[this.quality]

      if (lowerExt === '.webm') {
        // WebM uses VP9 codec
        args.push(
          '-c:v',
          'libvpx-vp9',
          '-crf',
          String(crf),
          '-b:v',
          '0',
          '-c:a',
          'libopus',
          '-b:a',
          '96k'
        )
      } else {
        // MP4, MKV, AVI, MOV use H.264
        args.push(
          '-c:v',
          'libx264',
          '-crf',
          String(crf),
          '-c:a',
          'aac',
          '-b:a',
          '128k'
        )
      }
    } else {
      const bitrate = AUDIO_BITRATE_PRESETS[this.quality]

      if (lowerExt === '.mp3' || lowerExt === '.flac' || lowerExt === '.wav') {
        args.push('-c:a', 'libmp3lame', '-b:a', bitrate)
      } else if (lowerExt === '.ogg') {
        args.push('-c:a', 'libvorbis', '-b:a', bitrate)
      } else {
        // m4a, aac
        args.push('-c:a', 'aac', '-b:a', bitrate)
      }
    }

    args.push('-y', outputPath)
    return args
  }

  async openMediaDialog() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          {
            name: 'Video',
            extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'],
          },
          {
            name: 'Audio',
            extensions: ['mp3', 'm4a', 'aac', 'ogg', 'flac', 'wav'],
          },
          {
            name: 'All Media',
            extensions: [
              'mp4',
              'mkv',
              'avi',
              'mov',
              'webm',
              'mp3',
              'm4a',
              'aac',
              'ogg',
              'flac',
              'wav',
            ],
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

    const { name } = splitPath(filePath)
    const mediaType = this.detectMediaType(filePath)

    const item: MediaItem = {
      id: `${Date.now()}-${Math.random()}`,
      fileName: name,
      filePath,
      mediaType,
      originalSize: fileSize || 0,
      outputSize: 0,
      progress: 0,
      isCompressing: false,
      isDone: false,
      outputPath: null,
      error: null,
    }

    this.items.push(item)
  }

  async compressAll() {
    for (const item of this.items) {
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
      const ffmpegArgs = this.buildFFmpegArgs(item, outputPath)

      console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '))

      // runFFmpeg returns a Promise at runtime (extended with kill/quit)
      await (tinker.runFFmpeg(ffmpegArgs, (progress) => {
        if (progress.percent !== undefined) {
          item.progress = Math.min(99, Math.round(progress.percent))
        }
      }) as unknown as Promise<void>)

      const buf = await tinker.readFile(outputPath)
      item.outputSize = buf.length
      item.progress = 100
      item.outputPath = outputPath
      item.isDone = true
      item.isCompressing = false
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Compression error:', message)
      item.error = message
      item.isCompressing = false
    }
  }

  removeItem(id: string) {
    const index = this.items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }

  clear() {
    this.items = []
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
