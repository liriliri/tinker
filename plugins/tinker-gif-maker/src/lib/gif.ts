import each from 'licia/each'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import uuid from 'licia/uuid'
import { THEME_COLORS } from 'share/theme'
import type { GifFrame } from '../types'

export const DEFAULT_BLANK_WIDTH = 320
export const DEFAULT_BLANK_HEIGHT = 240
export const DEFAULT_DELAY_MS = 100
export const MIN_DELAY_MS = 10
export const MAX_DELAY_MS = 25500

export async function decodeGif(data: Uint8Array): Promise<{
  frames: GifFrame[]
  width: number
  height: number
}> {
  if (typeof ImageDecoder === 'undefined') {
    throw new Error('ImageDecoder is not available')
  }

  const decoder = new ImageDecoder({ data, type: 'image/gif' })
  await decoder.tracks.ready
  const track = decoder.tracks.selectedTrack
  if (!track) {
    throw new Error('No GIF track found')
  }

  const frameCount = track.frameCount
  if (frameCount < 1) {
    throw new Error('GIF has no frames')
  }

  const frames: GifFrame[] = []
  let width = 0
  let height = 0

  try {
    for (let i = 0; i < frameCount; i++) {
      const { image } = await decoder.decode({ frameIndex: i })
      const frameWidth = image.displayWidth
      const frameHeight = image.displayHeight
      width = Math.max(width, frameWidth)
      height = Math.max(height, frameHeight)
      const delay = Math.max(
        MIN_DELAY_MS,
        Math.round((image.duration || 100_000) / 1000)
      )
      try {
        const url = await videoFrameToObjectUrl(image)
        frames.push({
          id: uuid(),
          url,
          delay,
          width: frameWidth,
          height: frameHeight,
        })
      } finally {
        image.close()
      }
    }
  } catch (error) {
    revokeFrameUrls(frames)
    throw error
  } finally {
    decoder.close()
  }

  return { frames, width, height }
}

export function createBlankFrame(
  width = DEFAULT_BLANK_WIDTH,
  height = DEFAULT_BLANK_HEIGHT,
  delay = DEFAULT_DELAY_MS,
  backgroundColor: string = THEME_COLORS.bg.light.primary
): GifFrame {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }
  const url = canvas.toDataURL('image/png')
  return { id: uuid(), url, delay, width, height, isBlank: true }
}

async function createFrameFromImageSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
  delay = DEFAULT_DELAY_MS,
  backgroundColor: string = THEME_COLORS.bg.light.primary
): Promise<GifFrame> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const drawW = sourceWidth * scale
  const drawH = sourceHeight * scale
  ctx.drawImage(source, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH)

  const url = await canvasToObjectUrl(canvas)
  return { id: uuid(), url, delay, width, height }
}

export async function createFrameFromFile(
  file: File,
  width: number,
  height: number,
  delay = DEFAULT_DELAY_MS,
  backgroundColor: string = THEME_COLORS.bg.light.primary
): Promise<GifFrame[]> {
  if (endWith(lowerCase(file.name), '.gif') || file.type === 'image/gif') {
    const data = new Uint8Array(await file.arrayBuffer())
    const decoded = await decodeGif(data)
    const frames: GifFrame[] = []
    try {
      for (const frame of decoded.frames) {
        const img = await loadImage(frame.url)
        frames.push(
          await createFrameFromImageSource(
            img,
            width,
            height,
            img.naturalWidth,
            img.naturalHeight,
            frame.delay,
            backgroundColor
          )
        )
      }
    } finally {
      revokeFrameUrls(decoded.frames)
    }
    return frames
  }

  const img = await loadImage(URL.createObjectURL(file))
  try {
    return [
      await createFrameFromImageSource(
        img,
        width,
        height,
        img.naturalWidth,
        img.naturalHeight,
        delay,
        backgroundColor
      ),
    ]
  } finally {
    URL.revokeObjectURL(img.src)
  }
}

export function revokeFrameUrls(frames: GifFrame[]) {
  each(frames, (frame) => {
    if (startWith(frame.url, 'blob:')) {
      URL.revokeObjectURL(frame.url)
    }
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

async function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Failed to encode frame'))
    }, 'image/png')
  })
  return URL.createObjectURL(blob)
}

async function videoFrameToObjectUrl(frame: VideoFrame): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = frame.displayWidth
  canvas.height = frame.displayHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.drawImage(frame, 0, 0)
  return canvasToObjectUrl(canvas)
}
