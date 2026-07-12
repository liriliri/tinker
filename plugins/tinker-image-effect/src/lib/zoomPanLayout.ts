import clamp from 'licia/clamp'

export const PREVIEW_FIT_AREA = 0.9

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
