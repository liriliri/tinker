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
} as const

/**
 * Generate Tailwind CSS class names with theme colors
 */
export const tw = {
  // Primary color utilities
  primary: {
    bg: 'bg-[#0fc25e]',
    bgHover: 'hover:bg-[#0da84f]',
    text: 'text-[#0fc25e]',
    border: 'border-[#0fc25e]',
    focusBorder: 'focus:border-[#0fc25e]',
  },

  // Background color utilities
  bg: {
    light: {
      primary: 'bg-white',
      secondary: 'bg-[#f0f1f2]',
      input: 'bg-white',
    },
    dark: {
      primary: 'dark:bg-[#1e1e1e]',
      secondary: 'dark:bg-[#303133]',
      tertiary: 'dark:bg-[#252526]',
      input: 'dark:bg-[#2d2d2d]',
      select: 'dark:bg-[#3e3e42]',
    },
  },

  // Border color utilities
  border: {
    light: 'border-[#e0e0e0]',
    dark: 'dark:border-[#4a4a4a]',
    both: 'border-[#e0e0e0] dark:border-[#4a4a4a]',
  },

  // Hover state utilities
  hover: {
    light: 'hover:bg-gray-200',
    dark: 'dark:hover:bg-[#3a3a3c]',
    both: 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c]',
  },

  // Active state utilities
  active: {
    light: 'bg-gray-300',
    dark: 'dark:bg-[#4a4a4a]',
    both: 'bg-gray-300 dark:bg-[#4a4a4a]',
  },

  // Text color utilities
  text: {
    light: {
      primary: 'text-gray-800',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
    },
    dark: {
      primary: 'dark:text-gray-200',
      secondary: 'dark:text-gray-300',
      tertiary: 'dark:text-gray-400',
    },
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
  }

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
