import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import isMobile from 'licia/isMobile'
import toNum from 'licia/toNum'

export interface FrameMetadata {
  offsetTop?: number
  pageScaleFactor?: number
  deviceWidth?: number
  deviceHeight?: number
  scrollOffsetX?: number
  scrollOffsetY?: number
}

export const BUTTONS = ['left', 'middle', 'right', 'back', 'forward'] as const

export function modifiersForEvent(event: KeyboardEvent | MouseEvent) {
  return (
    Number(event.getModifierState('Alt')) |
    (Number(event.getModifierState('Control')) << 1) |
    (Number(event.getModifierState('Meta')) << 2) |
    (Number(event.getModifierState('Shift')) << 3)
  )
}

export function insertTextForKey(event: ReactKeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return undefined
  }
  if (event.key === 'Enter') return '\r'
  if (event.key === 'Tab') return '\t'
  if (event.key.length === 1) return event.key
  return undefined
}

export function isTouchClient() {
  return isMobile()
}

export function toScreenPointFromOffset(
  offsetX: number,
  offsetY: number,
  canvas: HTMLCanvasElement,
  zoom: number,
  offsetTop: number
) {
  const drawOffsetX = toNum(canvas.dataset.offsetX) || 0
  const drawOffsetY = toNum(canvas.dataset.offsetY) || 0
  return {
    x: Math.round((offsetX - drawOffsetX) / zoom),
    y: Math.round((offsetY - drawOffsetY) / zoom - offsetTop),
  }
}

export function toScreenPoint(
  event: MouseEvent | WheelEvent,
  canvas: HTMLCanvasElement,
  zoom: number,
  offsetTop: number
) {
  return toScreenPointFromOffset(
    event.offsetX,
    event.offsetY,
    canvas,
    zoom,
    offsetTop
  )
}

export function touchCanvasOffset(touch: Touch, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  return {
    offsetX: touch.clientX - rect.left,
    offsetY: touch.clientY - rect.top,
  }
}

export function paintFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  meta: FrameMetadata
) {
  if (!image.naturalWidth) return null

  const deviceWidth = meta.deviceWidth || image.naturalWidth
  const deviceHeight = meta.deviceHeight || image.naturalHeight
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  if (cssWidth <= 0 || cssHeight <= 0) return null

  const zoom = Math.min(cssWidth / deviceWidth, cssHeight / deviceHeight)
  const offsetTop = toNum(meta.offsetTop) || 0

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(cssWidth * dpr)
  canvas.height = Math.floor(cssHeight * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cssWidth, cssHeight)

  const drawW = deviceWidth * zoom
  const drawH = deviceHeight * zoom
  const x = (cssWidth - drawW) / 2
  const y = (cssHeight - drawH) / 2
  ctx.drawImage(image, x, y, drawW, drawH)
  canvas.dataset.offsetX = String(x)
  canvas.dataset.offsetY = String(y)

  return { zoom, offsetTop }
}
