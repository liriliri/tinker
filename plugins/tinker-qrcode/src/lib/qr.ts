import {
  BrowserQRCodeReader,
  QRCodeWriter,
  BarcodeFormat,
  EncodeHintType,
  QRCodeDecoderErrorCorrectionLevel,
} from '@zxing/library'

export type CorrectLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRRenderOptions {
  text: string
  size: number
  fgColor: string
  bgColor: string
  correctLevel: CorrectLevel
  iconDataUrl?: string
}

export async function decodeQRFromUrl(url: string): Promise<string> {
  const img = new window.Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
  const reader = new BrowserQRCodeReader()
  const result = await reader.decodeFromImageElement(img)
  return result.getText()
}

const qrWriter = new QRCodeWriter()

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    255,
  ]
}

function correctLevelToZxing(
  level: CorrectLevel
): QRCodeDecoderErrorCorrectionLevel {
  switch (level) {
    case 'M':
      return QRCodeDecoderErrorCorrectionLevel.M
    case 'Q':
      return QRCodeDecoderErrorCorrectionLevel.Q
    case 'H':
      return QRCodeDecoderErrorCorrectionLevel.H
    default:
      return QRCodeDecoderErrorCorrectionLevel.L
  }
}

function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  size: number,
  fgColor: string,
  bgColor: string,
  correctLevel: CorrectLevel
) {
  const hints = new Map<EncodeHintType, unknown>()
  hints.set(EncodeHintType.ERROR_CORRECTION, correctLevelToZxing(correctLevel))
  hints.set(EncodeHintType.MARGIN, 2)

  const bitMatrix = qrWriter.encode(
    text,
    BarcodeFormat.QR_CODE,
    size,
    size,
    hints
  )

  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  const fg = hexToRgba(fgColor)
  const bg = hexToRgba(bgColor)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      const [r, g, b, a] = bitMatrix.get(x, y) ? fg : bg
      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = a
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

async function drawCenterIcon(
  canvas: HTMLCanvasElement,
  iconDataUrl: string,
  bgColor: string
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const iconSize = canvas.width * 0.2
      const x = (canvas.width - iconSize) / 2
      const y = (canvas.height - iconSize) / 2
      const padding = iconSize * 0.1
      ctx.fillStyle = bgColor
      ctx.fillRect(
        x - padding,
        y - padding,
        iconSize + padding * 2,
        iconSize + padding * 2
      )
      ctx.drawImage(img, x, y, iconSize, iconSize)
      resolve()
    }
    img.onerror = () => reject(new Error('Failed to load icon image'))
    img.src = iconDataUrl
  })
}

export async function renderQRCode(
  canvas: HTMLCanvasElement,
  options: QRRenderOptions
): Promise<string> {
  const { text, size, fgColor, bgColor, correctLevel, iconDataUrl } = options
  renderQRToCanvas(canvas, text, size, fgColor, bgColor, correctLevel)
  if (iconDataUrl) {
    await drawCenterIcon(canvas, iconDataUrl, bgColor)
  }
  return canvas.toDataURL('image/png')
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create PNG blob'))
      }
    }, 'image/png')
  })
}
