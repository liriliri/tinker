import { makeAutoObservable } from 'mobx'
import clamp from 'licia/clamp'
import BaseStore from 'share/store/Base'
import { openImageFile } from 'share/lib/util'
import { getPresetById } from './lib/presets'
import {
  clampCropRegion,
  computeCellRects,
  createEqualSizes,
  exportSplitImages,
} from './lib/split'
import type { CropRegion, ImageInfo } from './types'

class Store extends BaseStore {
  image: ImageInfo | null = null
  isLoading = false
  isSaving = false

  selectedPresetId = '3x3'
  rows = 3
  cols = 3
  rowSizes: number[] = createEqualSizes(3)
  colSizes: number[] = createEqualSizes(3)
  cropRegion: CropRegion = { left: 0, top: 0, width: 0, height: 0 }

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get hasImage() {
    return this.image !== null
  }

  get cells() {
    if (
      !this.image ||
      this.cropRegion.width <= 0 ||
      this.cropRegion.height <= 0
    ) {
      return []
    }

    return computeCellRects(this.cropRegion, this.rowSizes, this.colSizes)
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
        img.onload = () => resolve()
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

      this.resetCropRegion()
      this.applyPreset(this.selectedPresetId)
    } catch (err) {
      console.error('Failed to load image:', err)
      throw err
    } finally {
      this.isLoading = false
    }
  }

  resetCropRegion() {
    if (!this.image) return

    this.cropRegion = {
      left: 0,
      top: 0,
      width: this.image.width,
      height: this.image.height,
    }
  }

  setCropRegion(region: CropRegion) {
    if (!this.image) return

    this.cropRegion = clampCropRegion(
      region,
      this.image.width,
      this.image.height,
      this.rows,
      this.cols
    )
  }

  setGrid(rows: number, cols: number, presetId?: string) {
    const safeRows = clamp(Math.round(rows), 1, 16)
    const safeCols = clamp(Math.round(cols), 1, 16)

    this.rows = safeRows
    this.cols = safeCols
    this.rowSizes = createEqualSizes(safeRows)
    this.colSizes = createEqualSizes(safeCols)

    if (presetId) {
      this.selectedPresetId = presetId
    } else if (this.selectedPresetId !== 'custom') {
      const preset = getPresetById(this.selectedPresetId)
      if (!preset || preset.rows !== safeRows || preset.cols !== safeCols) {
        this.selectedPresetId = 'custom'
      }
    }

    if (this.image) {
      this.setCropRegion(this.cropRegion)
    }
  }

  applyPreset(presetId: string) {
    const preset = getPresetById(presetId)
    if (!preset) return

    this.setGrid(preset.rows, preset.cols, presetId)
  }

  setRowSizes(sizes: number[]) {
    this.rowSizes = sizes
  }

  setColSizes(sizes: number[]) {
    this.colSizes = sizes
  }

  async saveSplitImages() {
    if (!this.image || this.cells.length === 0) return

    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })

    if (result.canceled || !result.filePaths?.[0]) return

    try {
      this.isSaving = true
      await exportSplitImages(
        this.image.originalUrl,
        this.cells,
        this.image.fileName,
        result.filePaths[0]
      )
    } catch (err) {
      console.error('Failed to save split images:', err)
      throw err
    } finally {
      this.isSaving = false
    }
  }
}

export default new Store()
