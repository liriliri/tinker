import clamp from 'licia/clamp'

const VIEWER_THUMB_HEIGHT = 48
const VIEWER_THUMB_MIN_WIDTH = 32

export function getImageAspectRatio(width: number, height: number): number {
  return width > 0 && height > 0 ? width / height : 1
}

export function getViewerThumbWidth(width: number, height: number): number {
  return Math.max(
    VIEWER_THUMB_HEIGHT * getImageAspectRatio(width, height),
    VIEWER_THUMB_MIN_WIDTH
  )
}

export function clampHoverPreviewX(
  anchorRect: DOMRect,
  boundsRect: DOMRect,
  previewWidth: number
): number {
  const centerX = anchorRect.left + anchorRect.width / 2
  const halfWidth = previewWidth / 2
  const minX = boundsRect.left + halfWidth
  const maxX = boundsRect.right - halfWidth

  if (minX > maxX) {
    return boundsRect.left + boundsRect.width / 2
  }

  return clamp(centerX, minX, maxX)
}

export interface ImageRect {
  left: number
  top: number
  width: number
  height: number
}

export function computeFitRect(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  fitArea: number
): ImageRect {
  const area = clamp(fitArea, 0, 1)
  let width = containerWidth
  let height = containerHeight
  const aspectRatio = naturalWidth / naturalHeight

  if (height * aspectRatio > width) {
    height = width / aspectRatio
  } else {
    width = height * aspectRatio
  }

  width = Math.min(width * area, naturalWidth)
  height = Math.min(height * area, naturalHeight)

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  }
}

export function zoomRectAtPivot(
  rect: ImageRect,
  naturalWidth: number,
  naturalHeight: number,
  nextRatio: number,
  pivot?: { x: number; y: number }
): ImageRect {
  const { width, height, left, top } = rect
  const newWidth = naturalWidth * nextRatio
  const newHeight = naturalHeight * nextRatio
  const pivotPoint = pivot ?? {
    x: width / 2 + left,
    y: height / 2 + top,
  }

  return {
    width: newWidth,
    height: newHeight,
    left: left - (newWidth - width) * ((pivotPoint.x - left) / width),
    top: top - (newHeight - height) * ((pivotPoint.y - top) / height),
  }
}

export function computeFitRatio(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  fitArea: number
): number {
  const rect = computeFitRect(
    naturalWidth,
    naturalHeight,
    containerWidth,
    containerHeight,
    fitArea
  )
  return rect.width / naturalWidth
}
