import fileSize from 'licia/fileSize'
import last from 'licia/last'
import type { MetricId } from '../../common/types'
import type { MetricSample } from './metrics'
import { isPercentMetric } from './metrics'

export const POLL_INTERVAL_MS = 500
const PIXELS_PER_MS = 10 / 1000
const EXTRA_SPACE = 1.05
const MAX_SMOOTH_ALPHA = 0.2

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function trimBuffer(buffer: MetricSample[], width: number): void {
  const millisPerWidth = width / PIXELS_PER_MS
  const maxCount = Math.ceil((millisPerWidth / POLL_INTERVAL_MS) * 2)
  if (buffer.length > maxCount * 2) {
    buffer.splice(0, buffer.length - maxCount)
  }
}

function calcMax(
  buffer: MetricSample[],
  width: number,
  id: MetricId,
  curMax: number
): { max: number; curMax: number } {
  if (isPercentMetric(id)) {
    return { max: 100, curMax: 100 }
  }

  const startTime = performance.now() - POLL_INTERVAL_MS - width / PIXELS_PER_MS
  let peak = -Infinity

  for (let i = buffer.length - 1; i >= 0; i--) {
    peak = Math.max(peak, buffer[i].value)
    if (buffer[i].timestamp < startTime) break
  }

  if (!buffer.length) {
    return { max: 10 * EXTRA_SPACE, curMax: 10 }
  }

  const base10 = Math.pow(10, Math.floor(Math.log10(peak)))
  peak = Math.ceil(peak / base10 / 2) * base10 * 2

  const nextMax =
    peak * MAX_SMOOTH_ALPHA + (curMax || peak) * (1 - MAX_SMOOTH_ALPHA)
  return { max: nextMax * EXTRA_SPACE, curMax: nextMax }
}

interface PathContext {
  startTime: number
  calcY: (value: number) => number
}

function createPathContext(
  width: number,
  height: number,
  max: number,
  padTop: number,
  padBot: number
): PathContext {
  const visibleHeight = height - padTop - padBot
  const startTime = performance.now() - POLL_INTERVAL_MS - width / PIXELS_PER_MS
  const calcY = (value: number) =>
    Math.round(padTop + visibleHeight - (visibleHeight * value) / max) + 0.5
  return { startTime, calcY }
}

function traceCurve(
  path: Path2D,
  buffer: MetricSample[],
  ctx: PathContext,
  startX: number,
  startY: number
): { lastX: number; lastY: number } {
  let lastX = startX
  let lastY = startY
  for (let i = buffer.length - 1; i >= 0; i--) {
    const metric = buffer[i]
    const y = ctx.calcY(metric.value)
    const x = (metric.timestamp - ctx.startTime) * PIXELS_PER_MS
    const midX = (lastX + x) / 2
    path.bezierCurveTo(midX, lastY, midX, y, x, y)
    lastX = x
    lastY = y
    if (metric.timestamp < ctx.startTime) break
  }
  return { lastX, lastY }
}

function buildCurvePath(
  buffer: MetricSample[],
  width: number,
  height: number,
  max: number,
  padTop: number,
  padBot: number
): Path2D {
  const path = new Path2D()
  if (!buffer.length) return path

  const ctx = createPathContext(width, height, max, padTop, padBot)
  const startY = ctx.calcY(last(buffer).value)
  const startX = width + 5
  path.moveTo(startX, startY)
  traceCurve(path, buffer, ctx, startX, startY)
  return path
}

function buildFillPath(
  buffer: MetricSample[],
  width: number,
  height: number,
  max: number,
  padTop: number,
  padBot: number
): Path2D {
  const path = new Path2D()
  if (!buffer.length) return path

  const ctx = createPathContext(width, height, max, padTop, padBot)
  const baseline = ctx.calcY(0)
  const startX = width + 5
  const startY = ctx.calcY(last(buffer).value)
  const firstX = (buffer[0].timestamp - ctx.startTime) * PIXELS_PER_MS

  path.moveTo(firstX, baseline)
  path.lineTo(startX, baseline)
  path.lineTo(startX, startY)

  const { lastX } = traceCurve(path, buffer, ctx, startX, startY)
  path.lineTo(lastX, baseline)
  path.closePath()
  return path
}

interface DrawStreamingChartOptions {
  id: MetricId
  buffer: MetricSample[]
  color: string
  fgColor: string
  bgColor: string
  formatLabel: (value: number) => string
  curMax: number
}

interface DrawStreamingChartResult {
  curMax: number
  labelValue: number
}

const canvasSizeKey = Symbol('chartCanvasSize')

export function drawStreamingChart(
  canvas: HTMLCanvasElement,
  options: DrawStreamingChartOptions
): DrawStreamingChartResult {
  const { id, buffer, color, fgColor, bgColor, formatLabel, curMax } = options
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { curMax, labelValue: 0 }
  }

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const w = rect.width
  const h = rect.height
  if (w === 0 || h === 0) {
    return { curMax, labelValue: 0 }
  }

  trimBuffer(buffer, w)

  const sizeKey = `${w}x${h}x${dpr}`
  const chartCanvas = canvas as HTMLCanvasElement & {
    [canvasSizeKey]?: string
  }
  if (chartCanvas[canvasSizeKey] !== sizeKey) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    chartCanvas[canvasSizeKey] = sizeKey
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const padTop = 2
  const padBot = 2
  const labelValue = buffer.length ? last(buffer).value : 0

  if (buffer.length < 2) {
    return { curMax, labelValue }
  }

  const { max, curMax: nextMax } = calcMax(buffer, w, id, curMax)
  const fillPath = buildFillPath(buffer, w, h, max, padTop, padBot)
  const curvePath = buildCurvePath(buffer, w, h, max, padTop, padBot)

  ctx.strokeStyle = rgba(fgColor, 0.06)
  ctx.lineWidth = 1
  const drawH = h - padTop - padBot
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (drawH / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  ctx.fillStyle = rgba(color, 0.18)
  ctx.fill(fillPath)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.8
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke(curvePath)

  const label = formatLabel(labelValue)
  if (h >= 28) {
    ctx.font = `bold ${Math.max(
      8,
      Math.round(h * 0.2)
    )}px system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.strokeStyle = bgColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.strokeText(label, w - 2, padTop + 1)
    ctx.fillStyle = color
    ctx.fillText(label, w - 2, padTop + 1)
  }

  return { curMax: nextMax, labelValue }
}

export function formatRate(bytesPerSec: number): string {
  return `${fileSize(bytesPerSec)}/s`
}
