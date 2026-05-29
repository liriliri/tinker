import fileSize from 'licia/fileSize'
import last from 'licia/last'
import type { MetricId } from '../../common/types'
import { isPercentMetric } from './metrics'

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function curvePath(
  ctx: CanvasRenderingContext2D,
  history: number[],
  xStep: number,
  yPos: (val: number) => number
): void {
  const n = history.length
  if (n < 2) return
  ctx.moveTo(0, yPos(history[0]))
  for (let i = 1; i < n; i++) {
    const x = i * xStep
    const y = yPos(history[i])
    const prevX = (i - 1) * xStep
    const prevY = yPos(history[i - 1])
    const cpx = (prevX + x) / 2
    ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y)
  }
}

interface DrawChartOptions {
  id: MetricId
  history: number[]
  color: string
  fgColor: string
  bgColor: string
  formatLabel: (value: number) => string
}

export function drawLineChart(
  canvas: HTMLCanvasElement,
  options: DrawChartOptions
): void {
  const { id, history, color, fgColor, bgColor, formatLabel } = options
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const w = rect.width
  const h = rect.height
  if (w === 0 || h === 0) return

  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const padTop = 2
  const padBot = 2
  const drawH = h - padTop - padBot

  let dataMin: number
  let dataMax: number
  if (isPercentMetric(id)) {
    dataMin = 0
    dataMax = 100
  } else {
    dataMin = 0
    dataMax = history.length > 0 ? Math.max(1, ...history) * 1.15 : 1
  }
  if (dataMax === dataMin) dataMax = dataMin + 10
  const range = dataMax - dataMin
  const n = history.length
  if (n < 2) return

  const yPos = (val: number) =>
    padTop + drawH - ((val - dataMin) / range) * drawH
  const xStep = w / (n - 1)

  ctx.strokeStyle = rgba(fgColor, 0.06)
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (drawH / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + drawH)
  grad.addColorStop(0, rgba(color, 0.18))
  grad.addColorStop(1, rgba(color, 0.02))
  ctx.beginPath()
  curvePath(ctx, history, xStep, yPos)
  ctx.lineTo((n - 1) * xStep, padTop + drawH)
  ctx.lineTo(0, padTop + drawH)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  ctx.beginPath()
  curvePath(ctx, history, xStep, yPos)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.8
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  const label = formatLabel(last(history))
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
}

export function formatRate(bytesPerSec: number): string {
  return `${fileSize(bytesPerSec)}/s`
}
