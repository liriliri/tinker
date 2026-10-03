import type { EffectId, EffectParamsMap } from '../types'
import { applyAscii } from './ascii'
import { computeWorkingDimensions, rasterizeImage } from './util'
import { applyPixelate } from './pixelate'
import { applySketch } from './sketch'

const MAX_PREVIEW_DIMENSION = 4096

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
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

function renderEffect(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  effectId: EffectId,
  params: EffectParamsMap
): void {
  const width = source.width
  const height = source.height
  target.width = width
  target.height = height

  const ctx = target.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  if (effectId === 'ai') {
    ctx.drawImage(source, 0, 0)
    return
  }

  if (effectId === 'pixelate') {
    const result = applyPixelate(source, params.pixelate)
    ctx.putImageData(result, 0, 0)
    return
  }

  const sourceCtx = source.getContext('2d')
  if (!sourceCtx) {
    throw new Error('Failed to get source canvas context')
  }

  const imageData = sourceCtx.getImageData(0, 0, width, height)

  if (effectId === 'ascii') {
    applyAscii(ctx, imageData, params.ascii)
    return
  }

  ctx.putImageData(applySketch(imageData, params.sketch), 0, 0)
}

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

  async loadPreviewFromUrl(url: string): Promise<{
    width: number
    height: number
  }> {
    const image = await this.loadHtmlImage(url)
    const width = image.naturalWidth
    const height = image.naturalHeight
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    ctx.drawImage(image, 0, 0)
    return { width, height }
  }

  async getSourceDataUrl(
    mimeType = 'image/png',
    quality?: number
  ): Promise<string> {
    if (!this.sourceCanvas) {
      throw new Error('No image loaded')
    }

    const blob = await canvasToBlob(this.sourceCanvas, mimeType, quality)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read source image'))
      reader.readAsDataURL(blob)
    })
  }

  async exportBlob(
    effectId: EffectId,
    params: EffectParamsMap,
    mimeType: string
  ): Promise<Blob> {
    if (!this.sourceCanvas) {
      throw new Error('No image loaded')
    }

    const quality = mimeType === 'image/jpeg' ? 0.92 : undefined

    if (effectId === 'ai') {
      return canvasToBlob(this.canvas, mimeType, quality)
    }

    const exportCanvas = document.createElement('canvas')
    renderEffect(this.sourceCanvas, exportCanvas, effectId, params)
    return canvasToBlob(exportCanvas, mimeType, quality)
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
