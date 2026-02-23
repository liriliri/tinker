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

const STORAGE_KEY_QUALITY = 'quality'
const STORAGE_KEY_OUTPUT_DIR = 'outputDir'
const STORAGE_KEY_MODE = 'mode'
const STORAGE_KEY_VIDEO_MODE = 'videoMode'
const STORAGE_KEY_AUDIO_MODE = 'audioMode'
const storage = new LocalStore('tinker-media-compressor')

export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.webm',
])
export const AUDIO_EXTENSIONS = new Set([
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

// CRF presets for H.264/VP9: lower value = higher quality (0-51, typical 18-28)
export const VIDEO_CRF_PRESETS = [35, 28, 23, 18, 15]

// Bitrate percentage presets (percentage of original bitrate)
export const VIDEO_BITRATE_PERCENTAGES = [30, 50, 70, 85, 95]

// Resolution percentage presets (percentage of original dimensions)
export const VIDEO_RESOLUTION_PERCENTAGES = [30, 50, 70, 85, 95]

// Audio bitrate presets
export const AUDIO_BITRATE_PRESETS = ['64k', '96k', '128k', '192k', '320k']

// Audio sample rate presets
export const AUDIO_SAMPLERATE_PRESETS = [22050, 32000, 44100, 48000, 96000]

// Audio bitrate presets for samplerate mode (matched to quality levels)
export const AUDIO_SAMPLERATE_BITRATES = ['96k', '128k', '192k', '256k', '320k']

class Store extends BaseStore {
  videoItems: MediaItem[] = []
  audioItems: MediaItem[] = []
  quality: number = 2
  outputDir: string = ''
  mode: MediaType = 'video'
  videoCompressionMode: VideoCompressionMode = 'crf'
  audioCompressionMode: AudioCompressionMode = 'bitrate'

  get items(): MediaItem[] {
    return this.mode === 'video' ? this.videoItems : this.audioItems
  }

  constructor() {
    super()
    makeAutoObservable(this)
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

  private buildCrfArgs(isVP9: boolean, crf: number): string[] {
    if (isVP9) {
      // -deadline good -cpu-used 2 balances encoding speed and quality for VP9
      return [
        '-c:v',
        'libvpx-vp9',
        '-crf',
        String(crf),
        '-b:v',
        '0',
        '-deadline',
        'good',
        '-cpu-used',
        '2',
        '-row-mt',
        '1',
        '-c:a',
        'libopus',
        '-b:a',
        '128k',
      ]
    }
    // -preset slow improves compression ~5-10% over default; yuv420p ensures broad device compatibility
    return [
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      String(crf),
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
    ]
  }

  private buildFFmpegArgs(item: MediaItem, outputPath: string): string[] {
    const args = ['-i', item.filePath]

    if (item.mediaType === 'video') {
      // Use source codec to select output codec rather than relying on file extension
      const videoCodec = item.videoInfo?.codec || ''
      const isVP9 = videoCodec === 'vp9' || videoCodec === 'vp8'

      if (this.videoCompressionMode === 'crf') {
        const crf = VIDEO_CRF_PRESETS[this.quality]
        args.push(...this.buildCrfArgs(isVP9, crf))
      } else if (this.videoCompressionMode === 'bitrate') {
        const percentage = VIDEO_BITRATE_PERCENTAGES[this.quality]
        const originalBitrate = item.videoInfo?.bitrate || 0

        if (originalBitrate > 0) {
          const targetBitrate = Math.round((originalBitrate * percentage) / 100)

          if (isVP9) {
            // VBR: allow 1.5x burst headroom for complex scenes; -deadline good -cpu-used 2 for speed/quality balance
            args.push(
              '-c:v',
              'libvpx-vp9',
              '-b:v',
              `${targetBitrate}k`,
              '-maxrate',
              `${Math.round(targetBitrate * 1.5)}k`,
              '-bufsize',
              `${targetBitrate * 2}k`,
              '-deadline',
              'good',
              '-cpu-used',
              '2',
              '-row-mt',
              '1',
              '-c:a',
              'libopus',
              '-b:a',
              '128k'
            )
          } else {
            // VBR: remove -minrate to allow encoder to go below target for simple content
            args.push(
              '-c:v',
              'libx264',
              '-preset',
              'slow',
              '-b:v',
              `${targetBitrate}k`,
              '-maxrate',
              `${Math.round(targetBitrate * 1.5)}k`,
              '-bufsize',
              `${targetBitrate * 2}k`,
              '-pix_fmt',
              'yuv420p',
              '-c:a',
              'aac',
              '-b:a',
              '128k'
            )
          }
        } else {
          const crf = VIDEO_CRF_PRESETS[this.quality]
          args.push(...this.buildCrfArgs(isVP9, crf))
        }
      } else if (this.videoCompressionMode === 'resolution') {
        const percentage = VIDEO_RESOLUTION_PERCENTAGES[this.quality]
        const originalWidth = item.videoInfo?.width || 0
        const originalHeight = item.videoInfo?.height || 0
        const originalBitrate = item.videoInfo?.bitrate || 0

        if (originalWidth > 0 && originalHeight > 0) {
          const targetWidth = Math.round((originalWidth * percentage) / 100)
          const targetHeight = Math.round((originalHeight * percentage) / 100)
          const evenWidth =
            targetWidth % 2 === 0 ? targetWidth : targetWidth - 1
          const evenHeight =
            targetHeight % 2 === 0 ? targetHeight : targetHeight - 1

          if (originalBitrate > 0) {
            const targetBitrate = Math.round(
              (originalBitrate * percentage) / 100
            )

            if (isVP9) {
              // Lanczos downscaling preserves sharpness better than default bilinear
              args.push(
                '-vf',
                `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
                '-c:v',
                'libvpx-vp9',
                '-b:v',
                `${targetBitrate}k`,
                '-maxrate',
                `${Math.round(targetBitrate * 1.5)}k`,
                '-bufsize',
                `${targetBitrate * 2}k`,
                '-deadline',
                'good',
                '-cpu-used',
                '2',
                '-row-mt',
                '1',
                '-c:a',
                'libopus',
                '-b:a',
                '128k'
              )
            } else {
              args.push(
                '-vf',
                `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
                '-c:v',
                'libx264',
                '-preset',
                'slow',
                '-b:v',
                `${targetBitrate}k`,
                '-maxrate',
                `${Math.round(targetBitrate * 1.5)}k`,
                '-bufsize',
                `${targetBitrate * 2}k`,
                '-pix_fmt',
                'yuv420p',
                '-c:a',
                'aac',
                '-b:a',
                '128k'
              )
            }
          } else {
            if (isVP9) {
              args.push(
                '-vf',
                `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
                '-c:v',
                'libvpx-vp9',
                '-crf',
                '28',
                '-b:v',
                '0',
                '-deadline',
                'good',
                '-cpu-used',
                '2',
                '-row-mt',
                '1',
                '-c:a',
                'libopus',
                '-b:a',
                '128k'
              )
            } else {
              args.push(
                '-vf',
                `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
                '-c:v',
                'libx264',
                '-preset',
                'slow',
                '-crf',
                '28',
                '-pix_fmt',
                'yuv420p',
                '-c:a',
                'aac',
                '-b:a',
                '128k'
              )
            }
          }
        } else {
          const crf = VIDEO_CRF_PRESETS[this.quality]
          args.push(...this.buildCrfArgs(isVP9, crf))
        }
      }
    } else {
      // Map source codec to output encoder; format stays the same as input
      const audioCodec = item.audioInfo?.codec || ''
      let encoder: string
      if (audioCodec === 'mp3') {
        encoder = 'libmp3lame'
      } else if (audioCodec === 'vorbis') {
        encoder = 'libvorbis'
      } else if (audioCodec === 'flac') {
        encoder = 'flac'
      } else if (audioCodec.startsWith('pcm_')) {
        encoder = 'pcm_s16le'
      } else {
        encoder = 'aac'
      }
      // Lossless codecs (flac, pcm) don't support bitrate control
      const isLossless = audioCodec === 'flac' || audioCodec.startsWith('pcm_')

      if (this.audioCompressionMode === 'bitrate') {
        const bitrate = AUDIO_BITRATE_PRESETS[this.quality]
        if (isLossless) {
          args.push('-c:a', encoder)
        } else {
          args.push('-c:a', encoder, '-b:a', bitrate)
        }
      } else if (this.audioCompressionMode === 'samplerate') {
        const sampleRate = AUDIO_SAMPLERATE_PRESETS[this.quality]
        const bitrate = AUDIO_SAMPLERATE_BITRATES[this.quality]
        if (isLossless) {
          args.push('-ar', String(sampleRate), '-c:a', encoder)
        } else {
          args.push('-ar', String(sampleRate), '-c:a', encoder, '-b:a', bitrate)
        }
      }
    }

    // Move MP4 metadata to the front of file for progressive web playback
    if (
      item.mediaType === 'video' &&
      outputPath.toLowerCase().endsWith('.mp4')
    ) {
      args.push('-movflags', '+faststart')
    }

    args.push('-y', outputPath)
    return args
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

      await (tinker.runFFmpeg(ffmpegArgs, (progress) => {
        runInAction(() => {
          if (progress.percent !== undefined) {
            item.progress = Math.min(99, Math.round(progress.percent))
          }
        })
      }) as unknown as Promise<void>)

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
      const message = err instanceof Error ? err.message : String(err)
      console.error('Compression error:', message)
      runInAction(() => {
        item.error = message
        item.isCompressing = false
      })
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
