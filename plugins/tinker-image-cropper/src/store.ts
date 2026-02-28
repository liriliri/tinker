import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { openImageFile } from 'share/lib/util'

const STORAGE_KEY_OVERWRITE = 'overwriteOriginal'
const storage = new LocalStore('tinker-image-cropper')

export interface ImageInfo {
  fileName: string
  filePath?: string
  originalUrl: string
  originalSize: number
  width: number
  height: number
}

interface HistoryState {
  imageInfo: ImageInfo
  timestamp: number
}

class Store extends BaseStore {
  image: ImageInfo | null = null
  isLoading: boolean = false

  croppedBlob: Blob | null = null
  croppedDataUrl: string = ''
  croppedWidth: number = 0
  croppedHeight: number = 0

  history: HistoryState[] = []
  historyIndex: number = -1

  overwriteOriginal: boolean = false
  isSaved: boolean = false

  aspectRatio: number | null = null // null means free aspect ratio
  cropBoxWidth: number = 0
  cropBoxHeight: number = 0

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadOverwriteSetting()
  }

  private loadOverwriteSetting() {
    const savedOverwrite = storage.get(STORAGE_KEY_OVERWRITE)
    if (savedOverwrite !== null) {
      this.overwriteOriginal = savedOverwrite === 'true'
    }
  }

  setOverwriteOriginal(overwrite: boolean) {
    this.overwriteOriginal = overwrite
    storage.set(STORAGE_KEY_OVERWRITE, String(overwrite))
  }

  setAspectRatio(ratio: number | null) {
    this.aspectRatio = ratio
  }

  setCropBoxSize(width: number, height: number) {
    this.cropBoxWidth = Math.round(width)
    this.cropBoxHeight = Math.round(height)
  }

  async openImageDialog() {
    const result = await openImageFile({ title: 'Open Image' })
    if (result) {
      await this.loadImage(result.file, result.filePath)
    }
  }

  async loadImage(file: File, filePath?: string) {
    try {
      this.isLoading = true

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

      if (this.image?.originalUrl) {
        URL.revokeObjectURL(this.image.originalUrl)
      }

      this.image = {
        fileName: file.name,
        filePath,
        originalUrl: url,
        originalSize: file.size,
        width: img.width,
        height: img.height,
      }

      this.croppedBlob = null
      this.croppedDataUrl = ''
      this.croppedWidth = 0
      this.croppedHeight = 0

      this.history = [
        {
          imageInfo: { ...this.image },
          timestamp: Date.now(),
        },
      ]
      this.historyIndex = 0
      this.isSaved = false
    } catch (err) {
      console.error('Failed to load image:', err)
      throw err
    } finally {
      this.isLoading = false
    }
  }

  setCroppedImage(blob: Blob, dataUrl: string, width: number, height: number) {
    this.croppedBlob = blob
    this.croppedDataUrl = dataUrl
    this.croppedWidth = width
    this.croppedHeight = height
  }

  applyCroppedImage() {
    if (!this.croppedBlob || !this.croppedDataUrl || !this.image) return

    const oldUrl = this.image.originalUrl
    const isInHistory = this.history.some(
      (h) => h.imageInfo.originalUrl === oldUrl
    )
    if (oldUrl && !isInHistory) {
      URL.revokeObjectURL(oldUrl)
    }

    this.image = {
      ...this.image,
      originalUrl: this.croppedDataUrl,
      width: this.croppedWidth,
      height: this.croppedHeight,
      originalSize: this.croppedBlob.size,
    }

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    this.history.push({
      imageInfo: { ...this.image },
      timestamp: Date.now(),
    })
    this.historyIndex = this.history.length - 1

    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    this.isSaved = false
  }

  async saveImage() {
    if (!this.image) return

    try {
      let savePath: string

      if (this.overwriteOriginal && this.image.filePath) {
        savePath = this.image.filePath
      } else {
        const result = await tinker.showSaveDialog({
          defaultPath: this.image.fileName.replace(/\.[^.]+$/, '-cropped$&'),
          filters: [
            {
              name: 'Images',
              extensions: ['png', 'jpg', 'jpeg', 'webp'],
            },
          ],
        })

        if (result.canceled || !result.filePath) {
          return
        }

        savePath = result.filePath
      }

      const response = await fetch(this.image.originalUrl)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      await tinker.writeFile(savePath, buffer)

      this.isSaved = true

      return savePath
    } catch (err) {
      console.error('Failed to save image:', err)
      throw err
    }
  }

  async copyImage() {
    if (!this.image) return

    try {
      const response = await fetch(this.image.originalUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])
    } catch (err) {
      console.error('Failed to copy image:', err)
      throw err
    }
  }

  undo() {
    if (!this.canUndo) return

    this.historyIndex--
    const state = this.history[this.historyIndex]
    this.image = { ...state.imageInfo }

    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    this.isSaved = false
  }

  redo() {
    if (!this.canRedo) return

    this.historyIndex++
    const state = this.history[this.historyIndex]
    this.image = { ...state.imageInfo }

    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    this.isSaved = false
  }

  get hasImage() {
    return this.image !== null
  }

  get canUndo() {
    return this.historyIndex > 0
  }

  get canRedo() {
    return this.historyIndex < this.history.length - 1
  }

  get originalAspectRatio() {
    if (!this.image) return null
    return this.image.width / this.image.height
  }
}

export default new Store()
