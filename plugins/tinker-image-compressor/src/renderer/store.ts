import { makeAutoObservable } from 'mobx'
import safeStorage from 'licia/safeStorage'
import toNum from 'licia/toNum'
import clamp from 'licia/clamp'
import each from 'licia/each'
import isEmpty from 'licia/isEmpty'
import sum from 'licia/sum'
import map from 'licia/map'
import type { ImageFormat, ImageItem } from './types/codecs'

const STORAGE_KEY_QUALITY = 'imageCompressor.quality'
const STORAGE_KEY_OVERWRITE = 'imageCompressor.overwriteOriginal'
const storage = safeStorage('local')

class Store {
  // Image list
  images: ImageItem[] = []

  // Compression settings
  quality: number = 80
  overwriteOriginal: boolean = true

  // UI state
  isDark: boolean = false

  // Worker
  private worker: Worker | null = null
  private workerCallbacks: Map<string, (result: any) => void> = new Map()

  constructor() {
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    this.loadQuality()
    this.loadOverwriteSetting()
    await this.initTheme()
    this.initWorker()
  }

  private loadQuality() {
    const savedQuality = storage.getItem(STORAGE_KEY_QUALITY)
    if (savedQuality !== null) {
      const quality = clamp(toNum(savedQuality), 1, 100)
      if (quality > 0) {
        this.quality = quality
      }
    }
  }

  private loadOverwriteSetting() {
    const savedOverwrite = storage.getItem(STORAGE_KEY_OVERWRITE)
    if (savedOverwrite !== null) {
      this.overwriteOriginal = savedOverwrite === 'true'
    }
  }

  private async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.setIsDark(newTheme === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }

  private initWorker() {
    this.worker = new Worker(
      new URL('./lib/compress.worker.ts', import.meta.url),
      { type: 'module' }
    )

    this.worker.onmessage = (e) => {
      const { type, id, result, error } = e.data

      if (type === 'result') {
        const callback = this.workerCallbacks.get(id)
        if (callback) {
          callback(result)
          this.workerCallbacks.delete(id)
        }
      } else if (type === 'error') {
        console.error('Compression error:', error)
        const image = this.images.find((img) => img.id === id)
        if (image) {
          image.isCompressing = false
        }
        this.workerCallbacks.delete(id)
      }
    }
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  setQuality(quality: number) {
    this.quality = quality
    storage.setItem(STORAGE_KEY_QUALITY, String(quality))

    // Reset compressed images when quality changes
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
    storage.setItem(STORAGE_KEY_OVERWRITE, String(overwrite))
  }

  async loadImages(files: Array<{ file: File; filePath?: string }>) {
    for (const item of files) {
      await this.loadImage(item.file, item.filePath)
    }
  }

  private detectImageFormat(fileName: string): ImageFormat {
    const ext = fileName.toLowerCase().split('.').pop() || ''
    if (ext === 'png') return 'png'
    if (ext === 'webp') return 'webp'
    return 'jpeg' // Default to jpeg for jpg, jpeg and unknown formats
  }

  async loadImage(file: File, filePath?: string) {
    try {
      // Check if image with same filePath already exists
      if (filePath && this.images.some((img) => img.filePath === filePath)) {
        console.log(`Image with path "${filePath}" already loaded, skipping`)
        return
      }

      const id = `${Date.now()}-${Math.random()}`
      const originalFormat = this.detectImageFormat(file.name)

      // Load image
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

      // Get image data
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)

      // Create image item
      const imageItem: ImageItem = {
        id,
        fileName: file.name,
        filePath,
        originalFormat,
        originalImage: img,
        originalImageData: imageData,
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
    if (!image || !this.worker) return

    image.isCompressing = true

    return new Promise<void>((resolve) => {
      this.workerCallbacks.set(
        id,
        (result: { data: Uint8Array; size: number }) => {
          this.handleCompressResult(id, result)
          resolve()
        }
      )

      this.worker!.postMessage({
        type: 'compress',
        id,
        imageData: {
          data: image.originalImageData.data,
          width: image.originalImageData.width,
          height: image.originalImageData.height,
        },
        options: {
          format: image.originalFormat,
          quality: this.quality,
        },
      })
    })
  }

  private handleCompressResult(
    id: string,
    result: { data: Uint8Array; size: number }
  ) {
    const image = this.images.find((img) => img.id === id)
    if (!image) return

    image.compressedSize = result.size
    image.isSaved = false // Reset saved status when recompressing

    // Create blob
    const mimeType =
      image.originalFormat === 'jpeg'
        ? 'image/jpeg'
        : image.originalFormat === 'png'
        ? 'image/png'
        : 'image/webp'

    image.compressedBlob = new Blob([new Uint8Array(result.data)], {
      type: mimeType,
    })

    // Create data URL for preview
    const reader = new FileReader()
    reader.onload = () => {
      image.compressedDataUrl = reader.result as string
      image.isCompressing = false
    }
    reader.readAsDataURL(image.compressedBlob)
  }

  async saveAll() {
    const compressedImages = this.images.filter((img) => img.compressedBlob)
    if (isEmpty(compressedImages)) return

    try {
      if (this.overwriteOriginal) {
        // Overwrite mode: save to original file paths
        for (const image of compressedImages) {
          if (!image.compressedBlob) continue

          // If no file path, skip (shouldn't happen when opened from dialog)
          if (!image.filePath) {
            console.warn(`No file path for ${image.fileName}, skipping`)
            continue
          }

          // If compressed size is larger than or equal to original, skip saving (keep original)
          if (image.compressedSize >= image.originalSize) {
            console.log(
              `Compressed size (${image.compressedSize}) >= original size (${image.originalSize}) for ${image.fileName}, keeping original file`
            )
            image.isSaved = true // Mark as saved since we're keeping the original
            continue
          }

          // Convert blob to buffer
          const arrayBuffer = await image.compressedBlob.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)

          // Overwrite the original file
          await imageCompressor.writeFile(image.filePath, buffer)

          // Mark as saved
          image.isSaved = true
        }
      } else {
        // Directory mode: ask user to select a directory
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

          const extension =
            image.originalFormat === 'jpeg'
              ? 'jpg'
              : image.originalFormat === 'png'
              ? 'png'
              : 'webp'

          const fileName = image.fileName.replace(/\.[^.]+$/, `.${extension}`)
          const filePath = `${directory}/${fileName}`

          // If compressed is larger, save original instead
          let buffer: Uint8Array
          if (image.compressedSize >= image.originalSize && image.filePath) {
            console.log(
              `Compressed size (${image.compressedSize}) >= original size (${image.originalSize}) for ${image.fileName}, saving original file`
            )
            // Read original file and save it
            const originalBuffer = await imageCompressor.readFile(
              image.filePath
            )
            buffer = new Uint8Array(originalBuffer)
          } else {
            // Convert compressed blob to buffer
            const arrayBuffer = await image.compressedBlob.arrayBuffer()
            buffer = new Uint8Array(arrayBuffer)
          }

          // Save file
          await imageCompressor.writeFile(filePath, buffer)

          // Mark as saved
          image.isSaved = true
        }
      }
    } catch (err) {
      console.error('Failed to save images:', err)
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
    // Revoke all image URLs to free memory
    each(this.images, (image) => URL.revokeObjectURL(image.originalUrl))
    this.images = []
  }

  get hasImages() {
    return this.images.length > 0
  }

  get hasCompressed() {
    return this.images.some((img) => img.compressedBlob !== null)
  }

  get hasUnsaved() {
    return this.images.some(
      (img) =>
        img.compressedBlob !== null &&
        !img.isSaved &&
        img.compressedSize < img.originalSize // Only count if compressed is smaller
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
    return (
      (1 - this.totalCompressedSize / this.totalOriginalSize) *
      100
    ).toFixed(1)
  }
}

export default new Store()
