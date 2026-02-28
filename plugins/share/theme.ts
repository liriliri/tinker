/**
 * Theme color configuration for all Tinker plugins
 */

export const THEME_COLORS = {
  // Primary theme color
  primary: '#0fc25e',
  primaryHover: '#0da84f',

  // Copy success state
  success: '#0fc25e',

  // Background colors
  bg: {
    light: {
      primary: '#ffffff',
      secondary: '#f0f1f2',
      tertiary: '#f3e5f5',
      input: '#ffffff',
      select: '#ffffff',
      code: '#252526',
    },
    dark: {
      primary: '#1e1e1e',
      secondary: '#303133',
      tertiary: '#252526',
      input: '#2d2d2d',
      select: '#3e3e42',
      code: '#252526',
    },
  },

  // Border colors
  border: {
    light: '#e0e0e0',
    dark: '#4a4a4a',
  },

  // Hover state background colors
  hover: {
    light: '#e5e5e5',
    dark: '#3a3a3c',
  },

  // Active state background colors
  active: {
    light: '#d5d5d5',
    dark: '#4a4a4a',
  },

  // Text colors
  text: {
    light: {
      primary: '#000000',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    dark: {
      primary: '#d4d4d4',
      secondary: '#9ca3af',
      tertiary: '#6b7280',
    },
  },

  // Extended gray colors for various UI elements
  gray: {
    light: {
      100: '#f6f8fa',
      200: '#e0e0e0',
      300: '#cccccc',
      400: '#8a8a8a',
      500: '#6e6e6e',
      600: '#666666',
      700: '#333333',
    },
    dark: {
      100: '#3a3a3c',
      200: '#4a4a4a',
      300: '#858585',
      400: '#d4d4d4',
    },
  },

  // Toast/Notification colors
  toast: {
    light: {
      bg: '#ffffff',
      text: '#333333',
    },
    dark: {
      bg: '#333333',
      text: '#ffffff',
    },
  },

  // Checkboard background (for image transparency)
  checkboard: {
    light: {
      light: '#ffffff',
      dark: '#e8e8e8',
    },
    dark: {
      light: '#2d2d30',
      dark: '#252526',
    },
  },
} as const

/**
 * Generate Tailwind CSS class names with theme colors
 */
export const tw = {
  // Primary color utilities
  primary: {
    bg: 'bg-[#0fc25e]',
    bgHover: 'hover:bg-[#0da84f]',
    bgActive: 'active:bg-[#0da84f]',
    text: 'text-[#0fc25e]',
    textHover: 'hover:!text-[#0fc25e]',
    border: 'border-[#0fc25e]',
    hoverBorder: 'hover:border-[#0fc25e]',
    focusBorder: 'focus:border-[#0fc25e]',
    focusRing: 'focus:ring-[#0fc25e]',
    accent: 'accent-[#0fc25e]',
    checkedBg: 'group-data-[checked]:bg-[#0fc25e]',
    checkedBorder: 'group-data-[checked]:border-[#0fc25e]',
  },

  // Background color utilities
  bg: {
    primary: 'bg-white dark:bg-[#1e1e1e]',
    secondary: 'bg-[#f0f1f2] dark:bg-[#303133]',
    tertiary: 'bg-[#f6f7f8] dark:bg-[#252526]',
    input: 'bg-white dark:bg-[#2d2d2d]',
    select: 'bg-white dark:bg-[#3e3e42]',
    code: 'bg-[#252526] dark:bg-[#252526]',
    border: 'bg-[#e0e0e0] dark:bg-[#4a4a4a]', // For separators using background color
  },

  // Border color utilities
  border: 'border-[#e0e0e0] dark:border-[#4a4a4a]',

  // Hover state utilities
  hover: 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c]',

  // Active state utilities
  active: 'bg-gray-300 dark:bg-[#4a4a4a]',
  activeFeedback: 'active:bg-gray-200 dark:active:bg-[#3a3a3c]',

  // Text color utilities
  text: {
    primary: 'text-gray-800 dark:text-gray-200',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400',
  },

  // Extended gray utilities
  gray: {
    text300: 'text-[#cccccc] dark:text-[#858585]',
    text400: 'text-[#8a8a8a] dark:text-[#d4d4d4]',
    text500: 'text-[#6e6e6e]',
    text600: 'text-[#666666]',
    border400: 'border-[#8a8a8a] dark:border-[#4a4a4a]',
    border500: 'border-[#6e6e6e]',
    border100: 'dark:border-[#3a3a3c]',
    border200: 'border-[#4a4a4a] dark:border-[#4a4a4a]',
    border600: 'border-[#d0d0d0] dark:border-[#555555]',
  },

  // Secondary action button (non-primary, neutral gray)
  secondary: {
    bg: 'bg-[#8a8a8a] hover:bg-[#757575] disabled:bg-[#8a8a8a]',
  },

  // Tooltip
  tooltip: {
    bg: 'bg-white dark:bg-[#2c2d30]',
    border: 'border-[#dcdfe6] dark:border-[#4c4d50]',
    text: 'text-gray-800 dark:text-[#f0f1f2]',
  },
} as const

// Export for CSS variable usage (for non-Tailwind scenarios)
export function applyThemeVariables() {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  const colors = {
    '--theme-primary': THEME_COLORS.primary,
    '--theme-primary-hover': THEME_COLORS.primaryHover,
    '--theme-bg-primary': isDark
      ? THEME_COLORS.bg.dark.primary
      : THEME_COLORS.bg.light.primary,
    '--theme-bg-secondary': isDark
      ? THEME_COLORS.bg.dark.secondary
      : THEME_COLORS.bg.light.secondary,
    '--theme-border': isDark
      ? THEME_COLORS.border.dark
      : THEME_COLORS.border.light,
    '--theme-text-primary': isDark
      ? THEME_COLORS.text.dark.primary
      : THEME_COLORS.text.light.primary,
    '--theme-text-secondary': isDark
      ? THEME_COLORS.text.dark.secondary
      : THEME_COLORS.text.light.secondary,
    '--toast-bg': isDark
      ? THEME_COLORS.toast.dark.bg
      : THEME_COLORS.toast.light.bg,
    '--toast-text': isDark
      ? THEME_COLORS.toast.dark.text
      : THEME_COLORS.toast.light.text,
  }

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
