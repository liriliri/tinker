import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

export interface ImageInfo {
  fileName: string
  filePath?: string
  originalUrl: string
  originalSize: number
  width: number
  height: number
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

  constructor() {
    super()
    makeAutoObservable(this)
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
      const fileName = imageCropper.getFileName(filePath)

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

  async saveImage() {
    if (!this.croppedBlob || !this.image) return

    try {
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

      // Convert blob to buffer
      const arrayBuffer = await this.croppedBlob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Save file
      await imageCropper.writeFile(result.filePath, buffer)

      return result.filePath
    } catch (err) {
      console.error('Failed to save image:', err)
      throw err
    }
  }

  clearImage() {
    if (this.image?.originalUrl) {
      URL.revokeObjectURL(this.image.originalUrl)
    }
    this.image = null
    this.croppedBlob = null
    this.croppedDataUrl = ''
    this.croppedWidth = 0
    this.croppedHeight = 0
  }

  get hasImage() {
    return this.image !== null
  }

  get hasCropped() {
    return this.croppedBlob !== null
  }
}

export default new Store()
