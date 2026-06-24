import type { CurveChannel } from '../types/curves'
import { getChannelColor } from './curves'

export interface ChannelHistograms {
  luma: number[]
  red: number[]
  green: number[]
  blue: number[]
}

const HISTOGRAM_SAMPLE_SIZE = 512
const SMOOTHING_SIGMA = 2
const PERCENTILE_CLIP = 0.99

function createHistogramBins(): number[] {
  return new Array(256).fill(0)
}

function applyGaussianSmoothing(histogram: number[], sigma: number) {
  if (sigma <= 0) return

  const kernelRadius = Math.ceil(sigma * 3)
  if (kernelRadius === 0 || kernelRadius >= histogram.length) return

  const kernelSize = kernelRadius * 2 + 1
  const kernel: number[] = []
  let kernelSum = 0
  const twoSigmaSq = 2 * sigma * sigma

  for (let i = 0; i < kernelSize; i++) {
    const x = i - kernelRadius
    const value = Math.exp(-(x * x) / twoSigmaSq)
    kernel.push(value)
    kernelSum += value
  }

  if (kernelSum > 0) {
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= kernelSum
    }
  }

  const original = histogram.slice()
  const len = histogram.length

  for (let i = 0; i < len; i++) {
    let smoothed = 0
    for (let k = 0; k < kernel.length; k++) {
      const offset = k - kernelRadius
      const sampleIndex = Math.min(len - 1, Math.max(0, i + offset))
      smoothed += original[sampleIndex] * kernel[k]
    }
    histogram[i] = smoothed
  }
}

function normalizeHistogramRange(histogram: number[], percentileClip: number) {
  if (histogram.length === 0) return

  const sorted = histogram.slice().sort((a, b) => a - b)
  const clipIndex = Math.round((sorted.length - 1) * percentileClip)
  const maxVal = sorted[Math.min(sorted.length - 1, clipIndex)]

  if (maxVal > 1e-6) {
    const scale = 1 / maxVal
    for (let i = 0; i < histogram.length; i++) {
      histogram[i] = Math.min(1, histogram[i] * scale)
    }
    return
  }

  histogram.fill(0)
}

function finalizeChannel(values: number[]): number[] {
  applyGaussianSmoothing(values, SMOOTHING_SIGMA)
  normalizeHistogramRange(values, PERCENTILE_CLIP)
  return values
}

function getSampleCanvas(source: HTMLCanvasElement): HTMLCanvasElement | null {
  const { width, height } = source
  if (!width || !height) return null

  const scale = Math.min(1, HISTOGRAM_SAMPLE_SIZE / Math.max(width, height))
  const sampleWidth = Math.max(1, Math.round(width * scale))
  const sampleHeight = Math.max(1, Math.round(height * scale))

  const gl = source.getContext('webgl', { preserveDrawingBuffer: true })
  if (gl) {
    const canvas = document.createElement('canvas')
    canvas.width = sampleWidth
    canvas.height = sampleHeight

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const imageData = ctx.createImageData(sampleWidth, sampleHeight)
    const row = new Uint8Array(width * 4)

    for (let sy = 0; sy < sampleHeight; sy++) {
      const y = Math.min(
        height - 1,
        Math.floor(((sy + 0.5) * height) / sampleHeight)
      )
      const glY = height - 1 - y
      gl.readPixels(0, glY, width, 1, gl.RGBA, gl.UNSIGNED_BYTE, row)

      for (let sx = 0; sx < sampleWidth; sx++) {
        const x = Math.min(
          width - 1,
          Math.floor(((sx + 0.5) * width) / sampleWidth)
        )
        const srcIndex = x * 4
        const dstIndex = (sy * sampleWidth + sx) * 4
        imageData.data[dstIndex] = row[srcIndex]
        imageData.data[dstIndex + 1] = row[srcIndex + 1]
        imageData.data[dstIndex + 2] = row[srcIndex + 2]
        imageData.data[dstIndex + 3] = row[srcIndex + 3]
      }
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  const canvas = document.createElement('canvas')
  canvas.width = sampleWidth
  canvas.height = sampleHeight

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight)
  return canvas
}

export function computeHistogramFromCanvas(
  source: HTMLCanvasElement
): ChannelHistograms | null {
  const canvas = getSampleCanvas(source)
  if (!canvas) return null

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  const red = createHistogramBins()
  const green = createHistogramBins()
  const blue = createHistogramBins()
  const luma = createHistogramBins()

  for (let i = 0; i < data.length; i += 8) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    red[r] += 1
    green[g] += 1
    blue[b] += 1

    const lumaValue = (r * 218 + g * 732 + b * 74) >> 10
    luma[Math.min(255, lumaValue)] += 1
  }

  return {
    red: finalizeChannel(red),
    green: finalizeChannel(green),
    blue: finalizeChannel(blue),
    luma: finalizeChannel(luma),
  }
}

export function getHistogramPath(data: number[]): string {
  if (!data.length) return ''

  const maxVal = Math.max(...data)
  if (maxVal <= 0) return ''

  const pathData = data
    .map((value, index) => `${index},${255 - (value / maxVal) * 255}`)
    .join(' ')

  return `M0,255 L${pathData} L255,255 Z`
}

export function getChannelHistogram(
  histogram: ChannelHistograms | null,
  channel: CurveChannel
): number[] | null {
  if (!histogram) return null
  return histogram[channel]
}

export function getHistogramOpacity(isDark: boolean): number {
  return isDark ? 0.15 : 0.6
}

export const HISTOGRAM_TRANSITION_MS = 500

function lerpChannelData(from: number[], to: number[], t: number): number[] {
  const result = new Array<number>(from.length)
  for (let i = 0; i < from.length; i++) {
    result[i] = from[i] + (to[i] - from[i]) * t
  }
  return result
}

export function lerpChannelHistograms(
  from: ChannelHistograms,
  to: ChannelHistograms,
  t: number
): ChannelHistograms {
  return {
    red: lerpChannelData(from.red, to.red, t),
    green: lerpChannelData(from.green, to.green, t),
    blue: lerpChannelData(from.blue, to.blue, t),
    luma: lerpChannelData(from.luma, to.luma, t),
  }
}

export interface RgbHistogramLayer {
  key: 'red' | 'green' | 'blue'
  color: string
  fillPath: string
  linePath: string
}

const RGB_HISTOGRAM_CHANNELS = ['red', 'green', 'blue'] as const

export function getRgbHistogramLayers(
  histogram: ChannelHistograms
): RgbHistogramLayer[] {
  const entries = RGB_HISTOGRAM_CHANNELS.map((key) => ({
    key,
    color: getChannelColor(key),
    data: histogram[key],
  }))

  const globalMax = Math.max(...entries.flatMap((entry) => entry.data), 1e-6)
  const toY = (value: number) => 255 - (value / globalMax) * 255

  return entries.map(({ key, color, data }) => {
    const lineCoords = data.map((value, index) => `${index},${toY(value)}`)
    const fillCoords = lineCoords.join(' ')

    return {
      key,
      color,
      fillPath: `M0,255 L${fillCoords} L255,255 Z`,
      linePath: `M${lineCoords.join(' L')}`,
    }
  })
}
