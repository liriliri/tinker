import type { GradientPreset } from '../types'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import max from 'licia/max'

export const gradientPresets: GradientPreset[] = [
  { name: 'Dreamy Purple', angle: 135, colors: ['#a18cd1', '#fbc2eb'] },
  { name: 'Sunset Glow', angle: 135, colors: ['#f6d365', '#fda085'] },
  { name: 'Ocean Blue', angle: 135, colors: ['#a1c4fd', '#c2e9fb'] },
  { name: 'Mint Fresh', angle: 135, colors: ['#84fab0', '#8fd3f4'] },
  { name: 'Sakura Pink', angle: 135, colors: ['#ff9a9e', '#fecfef'] },
  { name: 'Aurora Green', angle: 120, colors: ['#85ffbd', '#fffb7d'] },
  { name: 'Neon City', angle: 135, colors: ['#fa8bff', '#2bd2ff'] },
  { name: 'Morning Mist', angle: 135, colors: ['#cfd9df', '#e2ebf0'] },
  { name: 'Lemon Soda', angle: 135, colors: ['#f093fb', '#f5576c'] },
  { name: 'Starry Night', angle: 160, colors: ['#0f2027', '#203a43'] },
  { name: 'Coral Reef', angle: 135, colors: ['#ffecd2', '#fcb69f'] },
  { name: 'Sky Mirror', angle: 135, colors: ['#e0c3fc', '#8ec5fc'] },
]

export function wrapAngle(angle: number) {
  return ((Math.round(angle) % 360) + 360) % 360
}

export function gradientCss(angle: number, colors: string[]) {
  return `linear-gradient(${angle}deg, ${colors.join(', ')})`
}

export function matchGradientPreset(angle: number, colors: string[]) {
  const key = map(colors, (c) => c.toLowerCase()).join(',')
  return (
    find(
      gradientPresets,
      (p) =>
        p.angle === angle &&
        map(p.colors, (c) => c.toLowerCase()).join(',') === key
    )?.name ?? ''
  )
}

/** Matches CSS `deg` so Leafer fill lines up with the sidebar swatch. */
export function leaferGradientFill(
  angle: number,
  colors: string[],
  width: number,
  height: number
) {
  const w = max(1, width)
  const h = max(1, height)
  const angleRad = ((angle - 180) * Math.PI) / 180
  const segment =
    Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad))
  const x1 = w / 2 + Math.sin(angleRad) * (segment / 2)
  const y1 = h / 2 - Math.cos(angleRad) * (segment / 2)
  const x2 = w / 2 - Math.sin(angleRad) * (segment / 2)
  const y2 = h / 2 + Math.cos(angleRad) * (segment / 2)
  const stops = isEmpty(colors) ? gradientPresets[0].colors : colors
  const last = max(stops.length - 1, 1)
  return {
    type: 'linear' as const,
    from: { x: x1 / w, y: y1 / h, type: 'percent' as const },
    to: { x: x2 / w, y: y2 / h, type: 'percent' as const },
    stops: map(stops, (color, i) => ({
      offset: i / last,
      color,
    })),
  }
}
