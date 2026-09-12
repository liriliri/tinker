export const HIGH_QUALITY_DRAW_OPTIONS = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high' as const,
}

export interface CanvasExportResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

function prepareCanvasContext(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

async function loadImageElement(imageUrl: string) {
  const img = new Image()
  img.src = imageUrl

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
  })

  return img
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  width = canvas.width,
  height = canvas.height
): Promise<CanvasExportResult> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result)
      } else {
        reject(new Error('Failed to export image'))
      }
    }, 'image/png')
  })

  return {
    blob,
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  }
}

async function drawToCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): Promise<CanvasExportResult> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  prepareCanvasContext(ctx)
  draw(ctx)
  return exportCanvas(canvas, width, height)
}

export async function cropImageOnCanvas(
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const img = await loadImageElement(imageUrl)
  return drawToCanvas(width, height, (ctx) => {
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
  })
}

export async function resizeImageOnCanvas(
  imageUrl: string,
  width: number,
  height: number
) {
  const img = await loadImageElement(imageUrl)
  return drawToCanvas(width, height, (ctx) => {
    ctx.drawImage(img, 0, 0, width, height)
  })
}
