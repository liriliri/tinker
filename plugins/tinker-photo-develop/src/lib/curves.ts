import clamp from 'licia/clamp'
import type { CurveChannel, CurvePoint, Curves } from '../types/curves'

export function getCurvePath(points: CurvePoint[]): string {
  if (points.length < 2) return ''

  const n = points.length
  const deltas: number[] = []
  const ms: number[] = []

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    if (dx === 0) {
      deltas.push(dy > 0 ? 1e6 : dy < 0 ? -1e6 : 0)
    } else {
      deltas.push(dy / dx)
    }
  }

  ms.push(deltas[0])

  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      ms.push(0)
    } else {
      ms.push((deltas[i - 1] + deltas[i]) / 2)
    }
  }

  ms.push(deltas[n - 2])

  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      ms[i] = 0
      ms[i + 1] = 0
    } else {
      const alpha = ms[i] / deltas[i]
      const beta = ms[i + 1] / deltas[i]
      const tau = alpha * alpha + beta * beta
      if (tau > 9) {
        const scale = 3 / Math.sqrt(tau)
        ms[i] = scale * alpha * deltas[i]
        ms[i + 1] = scale * beta * deltas[i]
      }
    }
  }

  let path = ''

  if (points[0].x > 0) {
    path += `M 0 ${255 - points[0].y} L ${points[0].x} ${255 - points[0].y}`
  } else {
    path += `M ${points[0].x} ${255 - points[0].y}`
  }

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const m0 = ms[i]
    const m1 = ms[i + 1]
    const dx = p1.x - p0.x

    const cp1x = p0.x + dx / 3
    const cp1y = p0.y + (m0 * dx) / 3
    const cp2x = p1.x - dx / 3
    const cp2y = p1.y - (m1 * dx) / 3

    path += ` C ${cp1x.toFixed(2)} ${
      255 - Number(cp1y.toFixed(2))
    }, ${cp2x.toFixed(2)} ${255 - Number(cp2y.toFixed(2))}, ${p1.x} ${
      255 - p1.y
    }`
  }

  if (points[n - 1].x < 255) {
    path += ` L 255 ${255 - points[n - 1].y}`
  }

  return path
}

export function isDefaultCurve(points: CurvePoint[] | undefined): boolean {
  if (!points || points.length !== 2) return false
  const [p1, p2] = points
  return p1.x === 0 && p1.y === 0 && p2.x === 255 && p2.y === 255
}

export function isDefaultCurves(curves: Curves): boolean {
  return (
    isDefaultCurve(curves.luma) &&
    isDefaultCurve(curves.red) &&
    isDefaultCurve(curves.green) &&
    isDefaultCurve(curves.blue)
  )
}

export function cloneCurves(curves: Curves): Curves {
  return {
    luma: curves.luma.map((point) => ({ ...point })),
    red: curves.red.map((point) => ({ ...point })),
    green: curves.green.map((point) => ({ ...point })),
    blue: curves.blue.map((point) => ({ ...point })),
  }
}

export function getChannelColor(channel: CurveChannel): string {
  switch (channel) {
    case 'red':
      return '#FF6B6B'
    case 'green':
      return '#6BCB77'
    case 'blue':
      return '#4D96FF'
    default:
      return '#FFFFFF'
  }
}

export function getChannelSwatchStyle(channel: CurveChannel): {
  background?: string
  backgroundColor?: string
} {
  if (channel === 'luma') {
    return {
      background:
        'linear-gradient(to right, #1a1a1a 0%, #888888 50%, #ffffff 100%)',
    }
  }

  return { backgroundColor: getChannelColor(channel) }
}

function interpolateCubicHermite(
  x: number,
  p1: CurvePoint,
  p2: CurvePoint,
  m1: number,
  m2: number
): number {
  const dx = p2.x - p1.x
  if (dx <= 0) return p1.y

  const t = (x - p1.x) / dx
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2

  return h00 * p1.y + h10 * m1 * dx + h01 * p2.y + h11 * m2 * dx
}

export function applyCurveValue(val: number, points: CurvePoint[]): number {
  if (points.length < 2) return val

  const x = val * 255
  if (x <= points[0].x) return points[0].y / 255
  if (x >= points[points.length - 1].x) {
    return points[points.length - 1].y / 255
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (x <= p2.x) {
      const p0 = points[Math.max(0, i - 1)]
      const p3 = points[Math.min(points.length - 1, i + 2)]

      const deltaBefore = (p1.y - p0.y) / Math.max(0.001, p1.x - p0.x)
      const deltaCurrent = (p2.y - p1.y) / Math.max(0.001, p2.x - p1.x)
      const deltaAfter = (p3.y - p2.y) / Math.max(0.001, p3.x - p2.x)

      let tangentAtP1: number
      let tangentAtP2: number

      if (i === 0) {
        tangentAtP1 = deltaCurrent
      } else if (deltaBefore * deltaCurrent <= 0) {
        tangentAtP1 = 0
      } else {
        tangentAtP1 = (deltaBefore + deltaCurrent) / 2
      }

      if (i + 1 === points.length - 1) {
        tangentAtP2 = deltaCurrent
      } else if (deltaCurrent * deltaAfter <= 0) {
        tangentAtP2 = 0
      } else {
        tangentAtP2 = (deltaCurrent + deltaAfter) / 2
      }

      if (deltaCurrent !== 0) {
        const alpha = tangentAtP1 / deltaCurrent
        const beta = tangentAtP2 / deltaCurrent
        if (alpha * alpha + beta * beta > 9) {
          const tau = 3 / Math.sqrt(alpha * alpha + beta * beta)
          tangentAtP1 *= tau
          tangentAtP2 *= tau
        }
      }

      const resultY = interpolateCubicHermite(
        x,
        p1,
        p2,
        tangentAtP1,
        tangentAtP2
      )
      return clamp(resultY / 255, 0, 1)
    }
  }

  return points[points.length - 1].y / 255
}

export function buildCurveLut(points: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256 * 4)
  for (let i = 0; i < 256; i++) {
    const value = Math.round(applyCurveValue(i / 255, points) * 255)
    const offset = i * 4
    lut[offset] = value
    lut[offset + 1] = value
    lut[offset + 2] = value
    lut[offset + 3] = 255
  }
  return lut
}

export function isRgbCurvesActive(curves: Curves): boolean {
  return (
    !isDefaultCurve(curves.red) ||
    !isDefaultCurve(curves.green) ||
    !isDefaultCurve(curves.blue)
  )
}
