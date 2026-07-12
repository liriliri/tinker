export function computeWorkingDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number; scale: number } {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxDimension) {
    return { width, height, scale: 1 }
  }

  const scale = maxDimension / longEdge
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

export function rasterizeImage(
  image: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create image canvas context')
  }

  ctx.drawImage(image, 0, 0, width, height)
  return canvas
}
