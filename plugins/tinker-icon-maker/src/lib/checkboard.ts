import { THEME_COLORS } from 'share/theme'

type CheckColors =
  (typeof THEME_COLORS.checkboard)[keyof typeof THEME_COLORS.checkboard]

export function getCheckboardStyle(isDark: boolean): React.CSSProperties {
  const checkColors: CheckColors = isDark
    ? THEME_COLORS.checkboard.dark
    : THEME_COLORS.checkboard.light

  return {
    backgroundImage: `
      linear-gradient(45deg, ${checkColors.dark} 25%, transparent 25%),
      linear-gradient(-45deg, ${checkColors.dark} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${checkColors.dark} 75%),
      linear-gradient(-45deg, transparent 75%, ${checkColors.dark} 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: checkColors.light,
  }
}
