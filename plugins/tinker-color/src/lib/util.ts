// Color conversion utilities using 'color' package
import Color from 'color'
import trim from 'licia/trim'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

export interface LAB {
  l: number
  a: number
  b: number
}

// Parse hex to RGB
export function hexToRgb(hex: string): RGB {
  const color = Color(hex)
  const rgb = color.rgb().object()
  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
  }
}

// RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  return Color.rgb(r, g, b).hex()
}

// RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const hsl = Color.rgb(r, g, b).hsl().object()
  return {
    h: Math.round(hsl.h),
    s: Math.round(hsl.s),
    l: Math.round(hsl.l),
  }
}

// RGB to HSV
export function rgbToHsv(r: number, g: number, b: number): HSV {
  const hsv = Color.rgb(r, g, b).hsv().object()
  return {
    h: Math.round(hsv.h),
    s: Math.round(hsv.s),
    v: Math.round(hsv.v),
  }
}

// RGB to CMYK
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const cmyk = Color.rgb(r, g, b).cmyk().object()
  return {
    c: Math.round(cmyk.c),
    m: Math.round(cmyk.m),
    y: Math.round(cmyk.y),
    k: Math.round(cmyk.k),
  }
}

// RGB to LAB
export function rgbToLab(r: number, g: number, b: number): LAB {
  const lab = Color.rgb(r, g, b).lab().object()
  return {
    l: Math.round(lab.l * 1000) / 1000,
    a: Math.round(lab.a * 1000) / 1000,
    b: Math.round(lab.b * 1000) / 1000,
  }
}

// HSL to RGB (for color scheme calculations)
export function hslToRgb(h: number, s: number, l: number): RGB {
  const rgb = Color.hsl(h, s, l).rgb().object()
  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
  }
}

// Generate complementary color
export function getComplementaryColor(hex: string): string {
  return Color(hex).rotate(180).hex()
}

// Generate analogous colors
export function getAnalogousColors(hex: string): string[] {
  const color = Color(hex)
  return [-30, 30].map((offset) => color.rotate(offset).hex())
}

// RGB to HSI (Hue, Saturation, Intensity)
export function rgbToHsi(
  r: number,
  g: number,
  b: number
): { h: number; s: number; i: number } {
  r /= 255
  g /= 255
  b /= 255

  const intensity = (r + g + b) / 3
  const min = Math.min(r, g, b)
  const saturation = intensity === 0 ? 0 : 1 - min / intensity

  let hue = 0
  if (saturation !== 0) {
    const numerator = 0.5 * (r - g + (r - b))
    const denominator = Math.sqrt((r - g) * (r - g) + (r - b) * (g - b))
    const theta = Math.acos(numerator / denominator)
    hue = b <= g ? theta : 2 * Math.PI - theta
  }

  return {
    h: Math.round(((hue * 180) / Math.PI) * 10) / 10,
    s: Math.round(saturation * 10000) / 100,
    i: Math.round(intensity * 10000) / 100,
  }
}

// Format color values for display
export function formatHex(hex: string): string {
  return hex.replace('#', '').toUpperCase()
}

export function formatRgb(rgb: RGB): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

export function formatHsl(hsl: HSL): string {
  return `${hsl.h}, ${hsl.s}%, ${hsl.l}%`
}

export function formatHsv(hsv: HSV): string {
  return `${hsv.h}, ${hsv.s}%, ${hsv.v}%`
}

export function formatCmyk(cmyk: CMYK): string {
  return `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`
}

export function formatLab(lab: LAB): string {
  return `${lab.l}, ${lab.a}, ${lab.b}`
}

export function formatHsi(hsi: { h: number; s: number; i: number }): string {
  return `${hsi.h}, ${hsi.s}%, ${hsi.i}%`
}

// Generate color variants by adjusting lightness
export function getColorVariants(
  hex: string
): Array<{ color: string; lightness: number }> {
  const color = Color(hex)
  const hsl = color.hsl().object()
  const variants: Array<{ color: string; lightness: number }> = []

  for (let lightness = 10; lightness <= 90; lightness += 10) {
    variants.push({
      color: Color.hsl(hsl.h, hsl.s, lightness).hex(),
      lightness,
    })
  }

  return variants
}

// Parse color string and return hex format
export function parseColorToHex(
  value: string,
  format: 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab' | 'hsi'
): string | null {
  try {
    const trimmed = value.trim()

    switch (format) {
      case 'hex': {
        // Add # if missing
        const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
        const color = Color(hex)
        return color.hex()
      }

      case 'rgb': {
        // Parse "255, 0, 0" format
        const parts = trimmed.split(',').map((p) => parseInt(trim(p)))
        if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
          return null
        }
        return Color.rgb(parts[0], parts[1], parts[2]).hex()
      }

      case 'hsl': {
        // Parse "180, 50%, 50%" format
        const parts = trimmed.split(',').map((p) => trim(p).replace('%', ''))
        if (parts.length !== 3) {
          return null
        }
        const [h, s, l] = parts.map((p) => parseFloat(p))
        if ([h, s, l].some((p) => isNaN(p))) {
          return null
        }
        return Color.hsl(h, s, l).hex()
      }

      case 'hsv': {
        // Parse "180, 50%, 50%" format
        const parts = trimmed.split(',').map((p) => trim(p).replace('%', ''))
        if (parts.length !== 3) {
          return null
        }
        const [h, s, v] = parts.map((p) => parseFloat(p))
        if ([h, s, v].some((p) => isNaN(p))) {
          return null
        }
        return Color.hsv(h, s, v).hex()
      }

      case 'cmyk': {
        // Parse "0%, 100%, 100%, 0%" format
        const parts = trimmed.split(',').map((p) => trim(p).replace('%', ''))
        if (parts.length !== 4) {
          return null
        }
        const [c, m, y, k] = parts.map((p) => parseFloat(p))
        if ([c, m, y, k].some((p) => isNaN(p))) {
          return null
        }
        return Color.cmyk(c, m, y, k).hex()
      }

      case 'lab': {
        // Parse "50, 50, 50" format
        const parts = trimmed.split(',').map((p) => parseFloat(p.trim()))
        if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
          return null
        }
        return Color.lab(parts[0], parts[1], parts[2]).hex()
      }

      case 'hsi': {
        // Parse "180, 50%, 50%" format and convert HSI to RGB then to HEX
        const parts = trimmed.split(',').map((p) => p.trim().replace('%', ''))
        if (parts.length !== 3) {
          return null
        }
        const [h, s, i] = parts.map((p) => parseFloat(p))
        if ([h, s, i].some((p) => isNaN(p))) {
          return null
        }
        // Convert HSI to RGB
        const rgb = hsiToRgb(h, s / 100, i / 100)
        return rgbToHex(rgb.r, rgb.g, rgb.b)
      }

      default:
        return null
    }
  } catch {
    return null
  }
}

// HSI to RGB conversion
function hsiToRgb(h: number, s: number, i: number): RGB {
  const hRad = (h * Math.PI) / 180
  let r: number, g: number, b: number

  if (h < 120) {
    b = i * (1 - s)
    r = i * (1 + (s * Math.cos(hRad)) / Math.cos(Math.PI / 3 - hRad))
    g = 3 * i - (r + b)
  } else if (h < 240) {
    const hPrime = hRad - (2 * Math.PI) / 3
    r = i * (1 - s)
    g = i * (1 + (s * Math.cos(hPrime)) / Math.cos(Math.PI / 3 - hPrime))
    b = 3 * i - (r + g)
  } else {
    const hPrime = hRad - (4 * Math.PI) / 3
    g = i * (1 - s)
    b = i * (1 + (s * Math.cos(hPrime)) / Math.cos(Math.PI / 3 - hPrime))
    r = 3 * i - (g + b)
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255))),
  }
}
