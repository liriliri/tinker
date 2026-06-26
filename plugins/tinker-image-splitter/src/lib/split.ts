import clamp from 'licia/clamp'
import clone from 'licia/clone'
import fill from 'licia/fill'
import lpad from 'licia/lpad'
import splitPath from 'licia/splitPath'
import sum from 'licia/sum'
import { joinPath } from 'share/lib/util'
import type {
  CellPreview,
  CellRect,
  CropHandle,
  CropRegion,
  DisplayCellLayout,
} from '../types'

const MIN_FR = 0.05
const MIN_CELL_SIZE = 32

function getMinCropSize(rows: number, cols: number) {
  return {
    minWidth: cols * MIN_CELL_SIZE,
    minHeight: rows * MIN_CELL_SIZE,
  }
}

function getEffectiveMinCropSize(
  rows: number,
  cols: number,
  imageWidth: number,
  imageHeight: number
) {
  const { minWidth, minHeight } = getMinCropSize(rows, cols)

  return {
    minWidth: clamp(minWidth, imageWidth),
    minHeight: clamp(minHeight, imageHeight),
  }
}

export function createEqualSizes(count: number): number[] {
  return fill(Array(count), 1)
}

export function computeCellRects(
  crop: CropRegion,
  rowSizes: number[],
  colSizes: number[]
): CellRect[] {
  const rowTotal = sum(...rowSizes)
  const colTotal = sum(...colSizes)
  const cells: CellRect[] = []
  let index = 1

  let topOffset = 0
  for (let row = 0; row < rowSizes.length; row++) {
    const cellHeight = (rowSizes[row] / rowTotal) * crop.height
    let leftOffset = 0

    for (let col = 0; col < colSizes.length; col++) {
      const cellWidth = (colSizes[col] / colTotal) * crop.width

      cells.push({
        index,
        row,
        col,
        left: crop.left + leftOffset,
        top: crop.top + topOffset,
        width: cellWidth,
        height: cellHeight,
      })

      index++
      leftOffset += cellWidth
    }

    topOffset += cellHeight
  }

  return cells
}

export function getGridDividerPositions(
  totalSize: number,
  sizes: number[]
): number[] {
  const positions: number[] = []
  const total = sum(...sizes)
  let accumulated = 0

  for (let i = 0; i < sizes.length - 1; i++) {
    accumulated += (sizes[i] / total) * totalSize
    positions.push(accumulated)
  }

  return positions
}

export function getDisplayCellLayouts(
  cells: CellRect[],
  crop: CropRegion,
  scale: number
): DisplayCellLayout[] {
  return cells.map((cell) => ({
    index: cell.index,
    left: (cell.left - crop.left) * scale,
    top: (cell.top - crop.top) * scale,
    width: cell.width * scale,
    height: cell.height * scale,
  }))
}

export function moveCropRegion(
  startCrop: CropRegion,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number
): CropRegion {
  const left = clamp(startCrop.left + dx, 0, imageWidth - startCrop.width)
  const top = clamp(startCrop.top + dy, 0, imageHeight - startCrop.height)

  return {
    ...startCrop,
    left,
    top,
  }
}

export function clampCropRegion(
  crop: CropRegion,
  imageWidth: number,
  imageHeight: number,
  rows: number,
  cols: number
): CropRegion {
  const { minWidth, minHeight } = getEffectiveMinCropSize(
    rows,
    cols,
    imageWidth,
    imageHeight
  )
  const width = clamp(crop.width, minWidth, imageWidth)
  const height = clamp(crop.height, minHeight, imageHeight)
  const left = clamp(crop.left, 0, imageWidth - width)
  const top = clamp(crop.top, 0, imageHeight - height)

  return { left, top, width, height }
}

export function resizeCropRegion(
  handle: CropHandle,
  startCrop: CropRegion,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number,
  rows: number,
  cols: number
): CropRegion {
  const { minWidth, minHeight } = getEffectiveMinCropSize(
    rows,
    cols,
    imageWidth,
    imageHeight
  )

  let left = startCrop.left
  let top = startCrop.top
  let width = startCrop.width
  let height = startCrop.height

  if (handle.includes('e')) {
    width = startCrop.width + dx
  }
  if (handle.includes('w')) {
    width = startCrop.width - dx
  }
  if (handle.includes('s')) {
    height = startCrop.height + dy
  }
  if (handle.includes('n')) {
    height = startCrop.height - dy
  }

  width = clamp(width, minWidth, imageWidth)
  height = clamp(height, minHeight, imageHeight)

  if (handle.includes('w')) {
    left = startCrop.left + startCrop.width - width
  }
  if (handle.includes('n')) {
    top = startCrop.top + startCrop.height - height
  }

  left = clamp(left, 0, imageWidth - width)
  top = clamp(top, 0, imageHeight - height)

  return { left, top, width, height }
}

export function resizeAdjacentSizes(
  sizes: number[],
  index: number,
  deltaFr: number
): number[] | null {
  if (index < 0 || index >= sizes.length - 1) return null

  const nextSizes = clone(sizes)
  const newSize1 = nextSizes[index] + deltaFr
  const newSize2 = nextSizes[index + 1] - deltaFr

  if (newSize1 < MIN_FR || newSize2 < MIN_FR) return null

  nextSizes[index] = newSize1
  nextSizes[index + 1] = newSize2
  return nextSizes
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

function createCellCanvas(
  img: HTMLImageElement,
  cell: CellRect,
  width: number,
  height: number
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(
    img,
    cell.left,
    cell.top,
    cell.width,
    cell.height,
    0,
    0,
    width,
    height
  )

  return canvas
}

export async function generateCellPreviews(
  imageUrl: string,
  cells: CellRect[],
  previewSize = 128
): Promise<CellPreview[]> {
  if (cells.length === 0) return []

  const img = await loadImage(imageUrl)

  return cells.map((cell) => {
    const cellWidth = Math.max(1, cell.width)
    const cellHeight = Math.max(1, cell.height)
    const scale = clamp(
      Math.min(previewSize / cellWidth, previewSize / cellHeight),
      1
    )
    const canvasWidth = Math.max(1, Math.round(cellWidth * scale))
    const canvasHeight = Math.max(1, Math.round(cellHeight * scale))
    const canvas = createCellCanvas(img, cell, canvasWidth, canvasHeight)

    if (!canvas) {
      return { index: cell.index, url: '' }
    }

    return {
      index: cell.index,
      url: canvas.toDataURL('image/jpeg', 0.85),
    }
  })
}

function canvasToBuffer(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to export image'))
        return
      }

      const arrayBuffer = await blob.arrayBuffer()
      resolve(new Uint8Array(arrayBuffer))
    }, 'image/png')
  })
}

export async function exportSplitImages(
  imageUrl: string,
  cells: CellRect[],
  baseName: string,
  outputDir: string
): Promise<string[]> {
  const img = await loadImage(imageUrl)
  const padLength = String(cells.length).length
  const { name, ext } = splitPath(baseName)
  const nameBase = ext ? name.slice(0, name.length - ext.length) : name
  const savedPaths: string[] = []

  for (const cell of cells) {
    const width = Math.max(1, Math.round(cell.width))
    const height = Math.max(1, Math.round(cell.height))
    const canvas = createCellCanvas(img, cell, width, height)
    if (!canvas) continue

    const buffer = await canvasToBuffer(canvas)
    const fileName = `${nameBase}_${lpad(
      String(cell.index),
      padLength,
      '0'
    )}.png`
    const filePath = joinPath(outputDir, fileName)
    await tinker.writeFile(filePath, buffer)
    savedPaths.push(filePath)
  }

  return savedPaths
}
