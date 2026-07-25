import Color from 'color'
import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'
import {
  hexToRgb,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  rgbToLab,
  rgbToHsi,
  parseColorToHex,
  toCssHex,
  toCssRgb,
  toCssHsl,
  toCssHsv,
  toCssCmyk,
  toCssLab,
  toCssHsi,
  getComplementaryColor,
  getAnalogousColors,
  getColorVariants,
} from './lib/util'

type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab' | 'hsi'

const FORMATS: ColorFormat[] = [
  'hex',
  'rgb',
  'hsl',
  'hsv',
  'cmyk',
  'lab',
  'hsi',
]

interface SetArgs {
  color: string
  format?: ColorFormat
  alpha?: number
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get: (store) => serialize(store),
    set,
  })
}

function serialize(store: Store) {
  const hex = store.currentColor
  const alpha = store.alpha
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b)
  const hsi = rgbToHsi(rgb.r, rgb.g, rgb.b)

  return {
    hex: toCssHex(hex, alpha),
    rgb: toCssRgb(rgb, alpha),
    hsl: toCssHsl(hsl, alpha),
    hsv: toCssHsv(hsv),
    cmyk: toCssCmyk(cmyk),
    lab: toCssLab(lab),
    hsi: toCssHsi(hsi),
    alpha,
    complementary: getComplementaryColor(hex),
    analogous: getAnalogousColors(hex),
    variants: getColorVariants(hex).map((variant) => variant.color),
  }
}

function resolveHex(color: string, format?: ColorFormat): string | null {
  if (format) {
    return parseColorToHex(color, format)
  }

  try {
    return Color(color).hex()
  } catch {
    for (const fmt of FORMATS) {
      const hex = parseColorToHex(color, fmt)
      if (hex) return hex
    }
    return null
  }
}

function set(store: Store, args: SetArgs) {
  const hex = resolveHex(args.color, args.format)
  if (!hex) {
    throw new Error(`Invalid color: ${args.color}`)
  }

  store.setColor(hex)
  if (!isUndef(args.alpha)) {
    store.setAlpha(args.alpha)
  }

  return serialize(store)
}
