import { computeWorkingDimensions, rasterizeImage } from './imageLoad'
import { renderEffect } from './effects'
import type { EffectId, EffectParamsMap } from '../types'

const MAX_PREVIEW_DIMENSION = 4096

export class EffectRenderer {
  readonly canvas: HTMLCanvasElement
  private sourceCanvas: HTMLCanvasElement | null = null

  constructor() {
    this.canvas = document.createElement('canvas')
  }

  get hasImage() {
    return this.sourceCanvas !== null
  }

  async loadImage(file: File): Promise<{
    width: number
    height: number
    originalWidth: number
    originalHeight: number
    downscaled: boolean
  }> {
    const url = URL.createObjectURL(file)

    try {
      const image = await this.loadHtmlImage(url)
      const originalWidth = image.naturalWidth
      const originalHeight = image.naturalHeight

      const working = computeWorkingDimensions(
        originalWidth,
        originalHeight,
        MAX_PREVIEW_DIMENSION
      )

      this.sourceCanvas = rasterizeImage(image, working.width, working.height)
      this.canvas.width = working.width
      this.canvas.height = working.height

      return {
        width: working.width,
        height: working.height,
        originalWidth,
        originalHeight,
        downscaled: working.scale < 1,
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  render(effectId: EffectId, params: EffectParamsMap) {
    if (!this.sourceCanvas) return
    renderEffect(this.sourceCanvas, this.canvas, effectId, params)
  }

  async exportBlob(
    effectId: EffectId,
    params: EffectParamsMap,
    mimeType: string
  ): Promise<Blob> {
    if (!this.sourceCanvas) {
      throw new Error('No image loaded')
    }

    const exportCanvas = document.createElement('canvas')
    renderEffect(this.sourceCanvas, exportCanvas, effectId, params)

    const quality = mimeType === 'image/jpeg' ? 0.92 : undefined

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to export image'))
            return
          }
          resolve(blob)
        },
        mimeType,
        quality
      )
    })
  }

  dispose() {
    this.sourceCanvas = null
    this.canvas.width = 0
    this.canvas.height = 0
  }

  private loadHtmlImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to decode image'))
      image.src = url
    })
  }
}
