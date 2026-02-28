import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import clamp from 'licia/clamp'
import each from 'licia/each'
import isEmpty from 'licia/isEmpty'
import sum from 'licia/sum'
import map from 'licia/map'
import splitPath from 'licia/splitPath'
import mime from 'licia/mime'
import type { ImageItem } from './types'
import BaseStore from 'share/BaseStore'
import {
  buildFfmpegArgs,
  detectImageFormat,
  getFormatExtension,
} from './lib/compress'
import { extractJpegExif, injectJpegExif } from './lib/exif'

const STORAGE_KEY_QUALITY = 'quality'
const STORAGE_KEY_OVERWRITE = 'overwriteOriginal'
const STORAGE_KEY_KEEP_EXIF = 'keepExif'
const storage = new LocalStore('tinker-image-compressor')

class Store extends BaseStore {
  images: ImageItem[] = []

  quality: number = 80
  overwriteOriginal: boolean = true
  keepExif: boolean = false

  compareImageId: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    this.loadQuality()
    this.loadOverwriteSetting()
    this.loadKeepExifSetting()
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

  private loadKeepExifSetting() {
    const saved = storage.get(STORAGE_KEY_KEEP_EXIF)
    if (saved !== null) {
      this.keepExif = saved === 'true'
    }
  }

  setCompareImageId(id: string | null) {
    this.compareImageId = id
  }

  setQuality(quality: number) {
    this.quality = quality
    storage.set(STORAGE_KEY_QUALITY, String(quality))
    this.invalidateCompressedData()
  }

  setOverwriteOriginal(overwrite: boolean) {
    this.overwriteOriginal = overwrite
    storage.set(STORAGE_KEY_OVERWRITE, String(overwrite))
  }

  setKeepExif(keepExif: boolean) {
    this.keepExif = keepExif
    storage.set(STORAGE_KEY_KEEP_EXIF, String(keepExif))
    this.invalidateCompressedData()
  }

  private invalidateCompressedData() {
    for (const image of this.images) {
      if (image.compressedBlob) {
        URL.revokeObjectURL(image.compressedUrl)
        image.compressedBlob = null
        image.compressedSize = 0
        image.compressedUrl = ''
        image.isSaved = false
      }
    }
  }

  async loadImages(files: Array<{ file: File; filePath?: string }>) {
    for (const item of files) {
      await this.loadImage(item.file, item.filePath)
    }
  }

  private isCompressedSmaller(image: ImageItem): boolean {
    return image.compressedSize < image.originalSize
  }

  async openImageDialog() {
    const result = await tinker.showOpenDialog({
      filters: [
        {
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'webp'],
        },
      ],
      properties: ['openFile', 'multiSelections'],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return
    }

    const files: Array<{ file: File; filePath: string }> = []
    for (const filePath of result.filePaths) {
      const buffer = await tinker.readFile(filePath)
      const fileName = splitPath(filePath).name

      const file = new File([buffer], fileName, { type: 'image/*' })
      files.push({ file, filePath })
    }

    await this.loadImages(files)
  }

  async loadImage(file: File, filePath?: string) {
    if (filePath && this.images.some((img) => img.filePath === filePath)) {
      return
    }

    const id = `${Date.now()}-${Math.random()}`
    const originalFormat = detectImageFormat(file.name)

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
      compressedUrl: '',
      isCompressing: false,
      isSaved: false,
    }

    this.images.push(imageItem)
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
      const extension = getFormatExtension(image.originalFormat)
      const outputPath = `${tmpDir}/tinker-compressed-${timestamp}-${id}.${extension}`

      const ffmpegArgs = buildFfmpegArgs({
        filePath: image.filePath,
        outputPath,
        format: image.originalFormat,
        quality: this.quality,
        keepExif: this.keepExif,
      })

      await tinker.runFFmpeg(ffmpegArgs)

      let compressedBuffer = new Uint8Array(await tinker.readFile(outputPath))

      if (this.keepExif && image.originalFormat === 'jpeg' && image.filePath) {
        const originalBuffer = await tinker.readFile(image.filePath)
        const exifSegment = extractJpegExif(originalBuffer)
        if (exifSegment) {
          compressedBuffer = injectJpegExif(compressedBuffer, exifSegment)
        }
      }

      const compressedSize = compressedBuffer.length

      const mimeType = mime(image.originalFormat) as string
      const compressedBlob = new Blob([compressedBuffer], { type: mimeType })
      if (image.compressedUrl) {
        URL.revokeObjectURL(image.compressedUrl)
      }
      const compressedUrl = URL.createObjectURL(compressedBlob)

      image.compressedSize = compressedSize
      image.compressedUrl = compressedUrl
      image.compressedBlob = compressedBlob
      image.isSaved = false
      image.isCompressing = false
    } catch (err) {
      image.isCompressing = false
      throw err
    }
  }

  async saveAll() {
    const compressedImages = this.images.filter((img) => img.compressedBlob)
    if (isEmpty(compressedImages)) return

    if (this.overwriteOriginal) {
      for (const image of compressedImages) {
        if (!image.compressedBlob) continue

        if (!image.filePath) {
          continue
        }

        if (!this.isCompressedSmaller(image)) {
          image.isSaved = true
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

        const extension = getFormatExtension(image.originalFormat)
        const fileName = image.fileName.replace(/\.[^.]+$/, `.${extension}`)
        const filePath = `${directory}/${fileName}`

        let buffer: Uint8Array
        if (!this.isCompressedSmaller(image) && image.filePath) {
          buffer = await tinker.readFile(image.filePath)
        } else {
          const arrayBuffer = await image.compressedBlob.arrayBuffer()
          buffer = new Uint8Array(arrayBuffer)
        }

        await tinker.writeFile(filePath, buffer)

        image.isSaved = true
      }
    }
  }

  async copyCompressedImage(id: string) {
    const image = this.images.find((img) => img.id === id)
    if (!image || !image.compressedBlob) return

    await navigator.clipboard.write([
      new ClipboardItem({
        [image.compressedBlob.type]: image.compressedBlob,
      }),
    ])
  }

  removeImage(id: string) {
    const index = this.images.findIndex((img) => img.id === id)
    if (index !== -1) {
      const image = this.images[index]
      URL.revokeObjectURL(image.originalUrl)
      if (image.compressedUrl) {
        URL.revokeObjectURL(image.compressedUrl)
      }
      this.images.splice(index, 1)
    }
  }

  clear() {
    each(this.images, (image) => {
      URL.revokeObjectURL(image.originalUrl)
      if (image.compressedUrl) {
        URL.revokeObjectURL(image.compressedUrl)
      }
    })
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
        this.isCompressedSmaller(img)
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
