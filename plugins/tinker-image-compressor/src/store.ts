import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import clamp from 'licia/clamp'
import each from 'licia/each'
import isEmpty from 'licia/isEmpty'
import sum from 'licia/sum'
import map from 'licia/map'
import splitPath from 'licia/splitPath'
import last from 'licia/last'
import base64 from 'licia/base64'
import dataUrl from 'licia/dataUrl'
import mime from 'licia/mime'
import type { ImageFormat, ImageItem } from './types'
import BaseStore from 'share/BaseStore'

const STORAGE_KEY_QUALITY = 'quality'
const STORAGE_KEY_OVERWRITE = 'overwriteOriginal'
const storage = new LocalStore('tinker-image-compressor')

class Store extends BaseStore {
  images: ImageItem[] = []

  quality: number = 80
  overwriteOriginal: boolean = true

  compareImageId: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    this.loadQuality()
    this.loadOverwriteSetting()
  }

  private loadQuality() {
    const savedQuality = storage.get(STORAGE_KEY_QUALITY)
    if (savedQuality !== null) {
      this.quality = clamp(toNum(savedQuality), 1, 100)
    }
  }

  private loadOverwriteSetting() {
    const savedOverwrite = storage.get(STORAGE_KEY_OVERWRITE)
    if (savedOverwrite !== null) {
      this.overwriteOriginal = savedOverwrite === 'true'
    }
  }

  setCompareImageId(id: string | null) {
    this.compareImageId = id
  }

  setQuality(quality: number) {
    this.quality = quality
    storage.set(STORAGE_KEY_QUALITY, String(quality))

    for (const image of this.images) {
      if (image.compressedBlob) {
        image.compressedBlob = null
        image.compressedSize = 0
        image.compressedDataUrl = ''
        image.isSaved = false
      }
    }
  }

  setOverwriteOriginal(overwrite: boolean) {
    this.overwriteOriginal = overwrite
    storage.set(STORAGE_KEY_OVERWRITE, String(overwrite))
  }

  async loadImages(files: Array<{ file: File; filePath?: string }>) {
    for (const item of files) {
      await this.loadImage(item.file, item.filePath)
    }
  }

  private detectImageFormat(fileName: string): ImageFormat {
    const ext = last(fileName.toLowerCase().split('.')) || ''
    if (ext === 'png') return 'png'
    if (ext === 'webp') return 'webp'
    return 'jpeg'
  }

  private getFormatExtension(format: ImageFormat): string {
    switch (format) {
      case 'jpeg':
        return 'jpg'
      case 'png':
        return 'png'
      case 'webp':
        return 'webp'
    }
  }

  private isCompressedSmaller(image: ImageItem): boolean {
    return image.compressedSize < image.originalSize
  }

  async openImageDialog() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp'],
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

      const files: Array<{ file: File; filePath: string }> = []
      for (const filePath of result.filePaths) {
        const buffer = await tinker.readFile(filePath)
        const fileName = splitPath(filePath).name

        // Note: Buffer is Uint8Array-compatible but File expects a Uint8Array payload
        const uint8Array = new Uint8Array(buffer)
        const file = new File([uint8Array], fileName, { type: 'image/*' })
        files.push({ file, filePath })
      }

      await this.loadImages(files)
    } catch (err) {
      console.error('Failed to open image:', err)
      throw err
    }
  }

  async loadImage(file: File, filePath?: string) {
    try {
      if (filePath && this.images.some((img) => img.filePath === filePath)) {
        console.log(`Image with path "${filePath}" already loaded, skipping`)
        return
      }

      const id = `${Date.now()}-${Math.random()}`
      const originalFormat = this.detectImageFormat(file.name)

      const img = new Image()
      const url = URL.createObjectURL(file)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image'))
        }
        img.src = url
      })

      const imageItem: ImageItem = {
        id,
        fileName: file.name,
        filePath,
        originalFormat,
        originalImage: img,
        originalSize: file.size,
        originalUrl: url,
        compressedBlob: null,
        compressedSize: 0,
        compressedDataUrl: '',
        isCompressing: false,
        isSaved: false,
      }

      this.images.push(imageItem)
    } catch (err) {
      console.error('Failed to load image:', err)
      throw err
    }
  }

  async compressAll() {
    for (const image of this.images) {
      if (!image.compressedBlob) {
        await this.compressImage(image.id)
      }
    }
  }

  async compressImage(id: string) {
    const image = this.images.find((img) => img.id === id)
    if (!image || !image.filePath) return

    image.isCompressing = true

    try {
      const tmpDir = tinker.tmpdir()
      const timestamp = Date.now()
      const extension = this.getFormatExtension(image.originalFormat)
      const outputPath = `${tmpDir}/tinker-compressed-${timestamp}-${id}.${extension}`

      const ffmpegArgs = ['-i', image.filePath]

      switch (image.originalFormat) {
        case 'jpeg':
          // JPEG: Use libx264 quality-based encoding
          // PicSharp uses: quality, progressive, chromaSubsampling, optimizeCoding, trellisQuantisation
          ffmpegArgs.push(
            '-q:v',
            String(2 + Math.round((100 - this.quality) * 0.29)),
            '-huffman',
            'optimal', // optimizeCoding
            '-sampling-factor',
            this.quality >= 90 ? '1x1' : '2x2' // chromaSubsampling based on quality
          )

          // Progressive JPEG for better streaming
          if (this.quality >= 80) {
            ffmpegArgs.push('-progressive', '1')
          }
          break

        case 'png':
          // PNG: Use quantization for lossy compression (similar to pngquant/imagequant)
          if (this.quality < 100) {
            // Calculate color count based on quality (16 to 256 colors)
            const maxColors = Math.max(
              16,
              Math.round((this.quality / 100) * 256)
            )
            // Use split filter to apply palette quantization
            ffmpegArgs.push(
              '-vf',
              `split[a][b];[a]palettegen=max_colors=${maxColors}:stats_mode=single[p];[b][p]paletteuse=dither=sierra2_4a`
            )
          }
          // Use best compression level
          ffmpegArgs.push('-compression_level', '9')
          break

        case 'webp':
          // WebP: Match PicSharp settings
          // PicSharp uses: quality, lossless, preset, effort, smartSubsample
          ffmpegArgs.push('-q:v', String(this.quality))

          // Set preset based on quality (higher quality = photo preset)
          ffmpegArgs.push('-preset', this.quality >= 80 ? 'photo' : 'default')

          // Compression effort (0-6, higher is slower but better)
          ffmpegArgs.push(
            '-compression_level',
            String(Math.min(6, Math.round((this.quality / 100) * 6)))
          )

          // Enable smart subsampling for better quality
          if (this.quality >= 80) {
            ffmpegArgs.push('-auto-alt-ref', '1')
          }
          break
      }

      ffmpegArgs.push('-y', outputPath)

      tinker.runFFmpeg(ffmpegArgs)

      await new Promise<void>((resolve, reject) => {
        const maxAttempts = 100
        let attempts = 0

        const checkFile = async () => {
          try {
            const buffer = await tinker.readFile(outputPath)
            if (buffer && buffer.length > 0) {
              resolve()
              return
            }
          } catch {
            // File not ready yet
          }

          attempts++
          if (attempts >= maxAttempts) {
            reject(new Error('FFmpeg processing timeout'))
            return
          }

          setTimeout(checkFile, 100)
        }

        checkFile()
      })

      const compressedBuffer = await tinker.readFile(outputPath)
      const compressedSize = compressedBuffer.length

      const base64Str = base64.encode(Array.from(compressedBuffer))
      const mimeType = mime(image.originalFormat) as string
      const compressedDataUrl = dataUrl.stringify(base64Str, mimeType, {
        base64: true,
      })

      image.compressedSize = compressedSize
      image.compressedDataUrl = compressedDataUrl
      image.compressedBlob = new Blob([compressedBuffer], { type: mimeType })
      image.isSaved = false
      image.isCompressing = false
    } catch (err) {
      console.error('Compression error:', err)
      image.isCompressing = false
      throw err
    }
  }

  async saveAll() {
    const compressedImages = this.images.filter((img) => img.compressedBlob)
    if (isEmpty(compressedImages)) return

    try {
      if (this.overwriteOriginal) {
        for (const image of compressedImages) {
          if (!image.compressedBlob) continue

          if (!image.filePath) {
            console.warn(`No file path for ${image.fileName}, skipping`)
            continue
          }

          if (!this.isCompressedSmaller(image)) {
            console.log(
              `Compressed size (${image.compressedSize}) >= original size (${image.originalSize}) for ${image.fileName}, keeping original file`
            )
            image.isSaved = true // Mark as saved since we're keeping the original
            continue
          }

          const arrayBuffer = await image.compressedBlob.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)

          await tinker.writeFile(image.filePath, buffer)

          image.isSaved = true
        }
      } else {
        const result = await tinker.showOpenDialog({
          properties: ['openDirectory'],
        })

        if (
          result.canceled ||
          !result.filePaths ||
          result.filePaths.length === 0
        ) {
          return
        }

        const directory = result.filePaths[0]

        for (const image of compressedImages) {
          if (!image.compressedBlob) continue

          const extension = this.getFormatExtension(image.originalFormat)
          const fileName = image.fileName.replace(/\.[^.]+$/, `.${extension}`)
          const filePath = `${directory}/${fileName}`

          let buffer: Uint8Array
          if (!this.isCompressedSmaller(image) && image.filePath) {
            console.log(
              `Compressed size (${image.compressedSize}) >= original size (${image.originalSize}) for ${image.fileName}, saving original file`
            )
            const originalBuffer = await tinker.readFile(image.filePath)
            buffer = new Uint8Array(originalBuffer)
          } else {
            const arrayBuffer = await image.compressedBlob.arrayBuffer()
            buffer = new Uint8Array(arrayBuffer)
          }

          await tinker.writeFile(filePath, buffer)

          image.isSaved = true
        }
      }
    } catch (err) {
      console.error('Failed to save images:', err)
      throw err
    }
  }

  async copyCompressedImage(id: string) {
    const image = this.images.find((img) => img.id === id)
    if (!image || !image.compressedBlob) return

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [image.compressedBlob.type]: image.compressedBlob,
        }),
      ])
    } catch (err) {
      console.error('Failed to copy image:', err)
      throw err
    }
  }

  removeImage(id: string) {
    const index = this.images.findIndex((img) => img.id === id)
    if (index !== -1) {
      const image = this.images[index]
      URL.revokeObjectURL(image.originalUrl)
      this.images.splice(index, 1)
    }
  }

  clear() {
    each(this.images, (image) => URL.revokeObjectURL(image.originalUrl))
    this.images = []
  }

  get hasImages() {
    return this.images.length > 0
  }

  get hasCompressed() {
    return this.images.some((img) => img.compressedBlob !== null)
  }

  get hasUncompressed() {
    return this.images.some((img) => img.compressedBlob === null)
  }

  get hasUnsaved() {
    return this.images.some(
      (img) =>
        img.compressedBlob !== null &&
        !img.isSaved &&
        this.isCompressedSmaller(img) // Only count if compressed is smaller
    )
  }

  get isCompressing() {
    return this.images.some((img) => img.isCompressing)
  }

  get totalOriginalSize() {
    return sum(...map(this.images, (img) => img.originalSize))
  }

  get totalCompressedSize() {
    return sum(...map(this.images, (img) => img.compressedSize))
  }

  get totalCompressionRatio() {
    if (!this.totalOriginalSize || !this.totalCompressedSize) return 0
    return Math.abs(
      (1 - this.totalCompressedSize / this.totalOriginalSize) * 100
    ).toFixed(1)
  }
}

export default new Store()
