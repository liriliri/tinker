import max from 'licia/max'
import min from 'licia/min'
import type { Photo } from '../types'

const GUTTER = 4
const HORIZONTAL_PADDING = 16
const TARGET_COLUMN_WIDTH = 250
const MIN_COLUMN_WIDTH = 200
const MAX_COLUMNS = 8
const DEFAULT_ASPECT_RATIO = 4 / 3

interface MasonryColumnConfig {
  columnCount: number
  columnWidth: number
  gutter: number
}

export interface MasonryItemLayout {
  photoId: string
  left: number
  top: number
  width: number
  height: number
}

export function getMasonryColumnConfig(
  containerWidth: number
): MasonryColumnConfig {
  const availableWidth = Math.max(0, containerWidth - HORIZONTAL_PADDING)

  if (availableWidth <= 0) {
    return { columnCount: 2, columnWidth: 120, gutter: GUTTER }
  }

  let columnCount = Math.floor(
    (availableWidth + GUTTER) / (TARGET_COLUMN_WIDTH + GUTTER)
  )
  columnCount = Math.max(2, Math.min(MAX_COLUMNS, columnCount))

  let columnWidth = (availableWidth - (columnCount - 1) * GUTTER) / columnCount

  while (columnWidth < MIN_COLUMN_WIDTH && columnCount > 2) {
    columnCount -= 1
    columnWidth = (availableWidth - (columnCount - 1) * GUTTER) / columnCount
  }

  return { columnCount, columnWidth, gutter: GUTTER }
}

function getPhotoAspectRatio(photo: Photo): number {
  if (photo.width > 0 && photo.height > 0) {
    return photo.width / photo.height
  }
  return DEFAULT_ASPECT_RATIO
}

export function layoutMasonryItems(
  photos: Photo[],
  containerWidth: number
): { layouts: MasonryItemLayout[]; totalHeight: number } {
  const { columnCount, columnWidth, gutter } =
    getMasonryColumnConfig(containerWidth)
  const columnHeights = new Array<number>(columnCount).fill(0)
  const layouts: MasonryItemLayout[] = []

  for (const photo of photos) {
    const height = columnWidth / getPhotoAspectRatio(photo)
    const columnIndex = columnHeights.indexOf(min(...columnHeights))
    const left = columnIndex * (columnWidth + gutter)
    const top = columnHeights[columnIndex]

    layouts.push({
      photoId: photo.id,
      left,
      top,
      width: columnWidth,
      height,
    })

    columnHeights[columnIndex] += height + gutter
  }

  const totalHeight = Math.max(0, max(...columnHeights) - gutter)

  return { layouts, totalHeight }
}
