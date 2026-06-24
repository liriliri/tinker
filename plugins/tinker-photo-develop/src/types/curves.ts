export interface CurvePoint {
  x: number
  y: number
}

export type CurveChannel = 'luma' | 'red' | 'green' | 'blue'

export const CURVE_CHANNELS: CurveChannel[] = ['luma', 'red', 'green', 'blue']

export interface Curves {
  luma: CurvePoint[]
  red: CurvePoint[]
  green: CurvePoint[]
  blue: CurvePoint[]
}

export function getDefaultCurvePoints(): CurvePoint[] {
  return [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ]
}

export function getDefaultCurves(): Curves {
  const points = getDefaultCurvePoints()
  return {
    luma: points.map((point) => ({ ...point })),
    red: points.map((point) => ({ ...point })),
    green: points.map((point) => ({ ...point })),
    blue: points.map((point) => ({ ...point })),
  }
}
