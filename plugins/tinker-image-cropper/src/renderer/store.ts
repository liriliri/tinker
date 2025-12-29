import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'

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
  // Image state
  image: ImageInfo | null = null
  isLoading: boolean = false

  // Cropped result
  croppedBlob: Blob | null = null
  croppedDataUrl: string = ''
  croppedWidth: number = 0
  croppedHeight: number = 0

  // History for undo/redo
  history: HistoryState[] = []
  historyIndex: number = -1

  // Save settings
  overwriteOriginal: boolean = false
  isSaved: boolean = false

  // Crop settings
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
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'],
          },
        ],
        properties: ['openFile'],
      })

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return
      }

      const filePath = result.filePaths[0]
      const buffer = await imageCropper.readFile(filePath)
      const fileName = splitPath(filePath).name

      // Convert buffer to file
      const uint8Array = new Uint8Array(buffer)
      const file = new File([uint8Array], fileName, { type: 'image/*' })

      await this.loadImage(file, filePath)
    } catch (err) {
      console.error('Failed to open image:', err)
      throw err
    }
  }

  async loadImage(file: File, filePath?: string) {
    try {
      this.isLoading = true

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

      // Clean up old image URL if exists
      if (this.image?.originalUrl) {
        URL.revokeObjectURL(this.image.originalUrl)
      }

      // Set image info
      this.image = {
        fileName: file.name,
        filePath,
        originalUrl: url,
        originalSize: file.size,
        width: img.width,
        height: img.height,
      }

      // Reset cropped result
      this.croppedBlob = null
      this.croppedDataUrl = ''
      this.croppedWidth = 0
      this.croppedHeight = 0

      // Initialize history with the original image
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

    // Clean up old image URL (but not if it's in history)
    const oldUrl = this.image.originalUrl
    const isInHistory = this.history.some(
      (h) => h.imageInfo.originalUrl === oldUrl
    )
    if (oldUrl && !isInHistory) {
      URL.revokeObjectURL(oldUrl)
    }

    // Update image with cropped result
    this.image = {
      ...this.image,
      originalUrl: this.croppedDataUrl,
      width: this.croppedWidth,
      height: this.croppedHeight,
      originalSize: this.croppedBlob.size,
    }

    // Add to history (remove any forward history if we're not at the end)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    this.history.push({
      imageInfo: { ...this.image },
      timestamp: Date.now(),
    })
    this.historyIndex = this.history.length - 1

    // Reset cropped result
    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    // Mark as unsaved since we have a new cropped version
    this.isSaved = false
  }

  async saveImage() {
    if (!this.image) return

    try {
      let savePath: string

      if (this.overwriteOriginal && this.image.filePath) {
        // Overwrite mode: save to original file path
        savePath = this.image.filePath
      } else {
        // Ask user to select save location
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

      // Convert current image to blob
      const response = await fetch(this.image.originalUrl)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Save file
      await imageCropper.writeFile(savePath, buffer)

      // Mark as saved
      this.isSaved = true

      return savePath
    } catch (err) {
      console.error('Failed to save image:', err)
      throw err
    }
  }

  undo() {
    if (!this.canUndo) return

    this.historyIndex--
    const state = this.history[this.historyIndex]
    this.image = { ...state.imageInfo }

    // Reset cropped result
    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    // Mark as unsaved since we changed state
    this.isSaved = false
  }

  redo() {
    if (!this.canRedo) return

    this.historyIndex++
    const state = this.history[this.historyIndex]
    this.image = { ...state.imageInfo }

    // Reset cropped result
    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0

    // Mark as unsaved since we changed state
    this.isSaved = false
  }

  clearImage() {
    // Clean up all URLs in history
    for (const state of this.history) {
      if (state.imageInfo.originalUrl) {
        URL.revokeObjectURL(state.imageInfo.originalUrl)
      }
    }

    if (this.image?.originalUrl) {
      URL.revokeObjectURL(this.image.originalUrl)
    }
    this.image = null
    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0
    this.history = []
    this.historyIndex = -1
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
