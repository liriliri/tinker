import clone from 'licia/clone'
import flatten from 'licia/flatten'
import map from 'licia/map'
import unique from 'licia/unique'
import type {
  BackgroundColorPreset,
  BackgroundConfig,
  IconConfig,
  PlatformExportSpec,
  ThemePreset,
} from '../types'

export const DEFAULT_ICON: IconConfig = {
  size: 75,
  imageScale: 100,
  rotate: 0,
  offsetX: 0,
  offsetY: 0,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 12,
  shadowOpacity: 35,
  shadowOffsetY: 8,
}

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  transparent: false,
  color: '#ffffff',
  useGradient: false,
  gradientEnd: '#ffffff',
  gradientAngle: 135,
  rounded: 22,
  squircle: 0.8,
  padding: 12,
}

function preset(
  id: string,
  nameKey: string,
  icon: Partial<IconConfig>,
  background: Partial<BackgroundConfig>
): ThemePreset {
  return {
    id,
    nameKey,
    icon: { ...clone(DEFAULT_ICON), ...icon },
    background: { ...clone(DEFAULT_BACKGROUND), ...background },
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  preset('ios', 'presetIos', { size: 77 }, { color: '#ffffff', squircle: 0.8 }),
  preset(
    'android',
    'presetAndroid',
    { size: 66 },
    {
      color: '#4285F4',
      useGradient: true,
      gradientEnd: '#34A853',
      gradientAngle: 135,
      rounded: 100,
      squircle: 0,
      padding: 17,
    }
  ),
  preset(
    'macos',
    'presetMacos',
    { size: 72 },
    { color: '#ffffff', squircle: 0.8, padding: 14 }
  ),
  preset(
    'filled',
    'presetFilled',
    { size: 100 },
    {
      color: '#ffffff',
      rounded: 0,
      squircle: 0,
      padding: 0,
    }
  ),
  preset(
    'minimal',
    'presetMinimal',
    { size: 82 },
    { color: '#1a1a1a', squircle: 0.4, padding: 9 }
  ),
  preset(
    'circleDark',
    'presetCircleDark',
    { size: 65 },
    { color: '#1a1a1a', rounded: 100, squircle: 0, padding: 18 }
  ),
]

export const BACKGROUND_COLOR_PRESETS: BackgroundColorPreset[] = [
  { id: 'white', color: '#ffffff' },
  { id: 'snow', color: '#fafafa' },
  { id: 'black', color: '#1a1a1a' },
  { id: 'midnight', color: '#2c3e50' },
  { id: 'mint', color: '#00b894' },
  { id: 'lavender', color: '#a29bfe' },
  { id: 'gold', color: '#f9ca24' },
  {
    id: 'ocean',
    color: '#0093E9',
    gradientEnd: '#80D0C7',
    gradientAngle: 160,
  },
  {
    id: 'sunset',
    color: '#ff6b6b',
    gradientEnd: '#feca57',
    gradientAngle: 45,
  },
  {
    id: 'iris',
    color: '#667eea',
    gradientEnd: '#764ba2',
    gradientAngle: 135,
  },
  {
    id: 'aurora',
    color: '#a8edea',
    gradientEnd: '#fed6e3',
    gradientAngle: 120,
  },
  {
    id: 'forest',
    color: '#134e5e',
    gradientEnd: '#71b280',
    gradientAngle: 135,
  },
  {
    id: 'cosmic',
    color: '#0f0c29',
    gradientEnd: '#302b63',
    gradientAngle: 180,
  },
  {
    id: 'peach',
    color: '#ffecd2',
    gradientEnd: '#fcb69f',
    gradientAngle: 135,
  },
]

export const PLATFORM_SPECS: PlatformExportSpec[] = [
  {
    id: 'ios',
    nameKey: 'platformIos',
    folder: 'ios',
    sizes: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024],
  },
  {
    id: 'android',
    nameKey: 'platformAndroid',
    folder: 'android',
    sizes: [48, 72, 96, 144, 192, 512],
  },
  {
    id: 'macos',
    nameKey: 'platformMacos',
    folder: 'macos',
    sizes: [16, 32, 64, 128, 256, 512, 1024],
  },
  {
    id: 'windows',
    nameKey: 'platformWindows',
    folder: 'windows',
    sizes: [16, 24, 32, 48, 64, 128, 256],
  },
]

export const DEFAULT_PLATFORMS = map(PLATFORM_SPECS, (spec) => spec.id)

/** Common single-size export options collected from platform specs. */
export const EXPORT_SIZES: number[] = unique(
  flatten(map(PLATFORM_SPECS, (spec) => spec.sizes))
).sort((a: number, b: number) => a - b)
