import clamp from 'licia/clamp'
import Color from 'licia/Color'
import { CANVAS_SIZE, type BackgroundConfig, type IconConfig } from '../types'

function hexToRgba(hex: string, opacityPercent: number): string {
  const [r, g, b] = Color.parse(hex).val
  const a = clamp(opacityPercent, 0, 100) / 100
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function pathMask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roundRadius: number,
  squircle: number
) {
  const halfW = w / 2
  const halfH = h / 2
  const cx = x + halfW
  const cy = y + halfH
  const radius = Math.min(roundRadius, halfW, halfH)

  if (squircle === 0 || radius === 0) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radius)
    return
  }

  const n = 4 + squircle * 2
  const samples = Math.min(720, Math.max(180, Math.round(Math.max(w, h) / 2)))
  ctx.beginPath()
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    const px = cx + (cos >= 0 ? 1 : -1) * halfW * Math.pow(Math.abs(cos), 2 / n)
    const py = cy + (sin >= 0 ? 1 : -1) * halfH * Math.pow(Math.abs(sin), 2 / n)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function drawSourceImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  icon: IconConfig,
  canvasSize: number,
  contentBox: number
) {
  const imgW =
    'naturalWidth' in image
      ? (image as HTMLImageElement).naturalWidth ||
        (image as HTMLImageElement).width
      : (image as HTMLCanvasElement).width
  const imgH =
    'naturalHeight' in image
      ? (image as HTMLImageElement).naturalHeight ||
        (image as HTMLImageElement).height
      : (image as HTMLCanvasElement).height

  if (!imgW || !imgH) return

  const offsetX = (icon.offsetX / 100) * contentBox
  const offsetY = (icon.offsetY / 100) * contentBox
  const scale =
    Math.min(contentBox / imgW, contentBox / imgH) * (icon.imageScale / 100)
  const drawW = imgW * scale
  const drawH = imgH * scale
  const cx = canvasSize / 2 + offsetX
  const cy = canvasSize / 2 + offsetY

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((icon.rotate * Math.PI) / 180)
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH)
  ctx.restore()
}

/**
 * Box the source image is scaled into, derived from the icon size and the
 * background padding. The preview uses it to map pointer drags to offsets.
 */
export function computeContentBox(
  icon: IconConfig,
  background: BackgroundConfig,
  canvasSize: number
): number {
  const pad = (background.padding / 100) * canvasSize
  return (icon.size / 100) * (canvasSize - pad * 2)
}

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource | null,
  icon: IconConfig,
  background: BackgroundConfig,
  canvasSize: number
) {
  const pad = (background.padding / 100) * canvasSize
  const contentBox = computeContentBox(icon, background, canvasSize)
  const plate = contentBox + pad * 2
  const radius = (background.rounded / 100) * (plate / 2)
  const ox = (canvasSize - plate) / 2
  const oy = ox
  const squircle = background.squircle

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  if (!background.transparent) {
    if (background.useGradient) {
      const angle = (background.gradientAngle * Math.PI) / 180
      const cx = ox + plate / 2
      const cy = oy + plate / 2
      const r = (plate / 2) * Math.SQRT2
      const gradient = ctx.createLinearGradient(
        cx - Math.cos(angle) * r,
        cy - Math.sin(angle) * r,
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r
      )
      gradient.addColorStop(0, background.color)
      gradient.addColorStop(1, background.gradientEnd)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = background.color
    }
    ctx.fillRect(0, 0, canvasSize, canvasSize)
  }

  if (image) {
    const scaleRef = canvasSize / CANVAS_SIZE
    if (icon.shadowEnabled) {
      ctx.save()
      ctx.shadowColor = hexToRgba(icon.shadowColor, icon.shadowOpacity)
      ctx.shadowBlur = Math.max(0, icon.shadowBlur) * scaleRef
      ctx.shadowOffsetY = icon.shadowOffsetY * scaleRef
      drawSourceImage(ctx, image, icon, canvasSize, contentBox)
      ctx.restore()
    } else {
      drawSourceImage(ctx, image, icon, canvasSize, contentBox)
    }
  }

  ctx.globalCompositeOperation = 'destination-in'
  pathMask(ctx, ox, oy, plate, plate, radius, squircle)
  // Only the alpha channel of this fill matters for the mask, so any opaque color works.
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

export function createIconCanvas(
  image: CanvasImageSource | null,
  icon: IconConfig,
  background: BackgroundConfig,
  canvasSize: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d')
  if (ctx) {
    drawIcon(ctx, image, icon, background, canvasSize)
  }
  return canvas
}

export async function canvasToPngBytes(
  canvas: HTMLCanvasElement
): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Failed to encode PNG'))
    }, 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

export function resizeCanvas(
  source: HTMLCanvasElement,
  size: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, size, size)
  }
  return canvas
}
