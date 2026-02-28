import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import {
  ModuleRegistry,
  AllCommunityModule,
  themeAlpine,
} from 'ag-grid-community'
import { useMemo, forwardRef } from 'react'
import { THEME_COLORS } from 'share/theme'

ModuleRegistry.registerModules([AllCommunityModule])

interface GridProps<TData> extends AgGridReactProps<TData> {
  isDark: boolean
}

function GridInner<TData>(
  { isDark, ...props }: GridProps<TData>,
  ref: React.Ref<AgGridReact<TData>>
) {
  const theme = useMemo(() => {
    return themeAlpine.withParams({
      accentColor: THEME_COLORS.primary,
      backgroundColor: isDark
        ? THEME_COLORS.bg.dark.primary
        : THEME_COLORS.bg.light.primary,
      foregroundColor: isDark
        ? THEME_COLORS.text.dark.primary
        : THEME_COLORS.text.light.primary,
      browserColorScheme: isDark ? 'dark' : 'light',
      borderWidth: 0,
      borderRadius: 0,
      headerBackgroundColor: isDark
        ? THEME_COLORS.bg.dark.secondary
        : THEME_COLORS.bg.light.secondary,
      headerTextColor: isDark
        ? THEME_COLORS.text.dark.primary
        : THEME_COLORS.text.light.primary,
      oddRowBackgroundColor: isDark
        ? THEME_COLORS.bg.dark.tertiary
        : THEME_COLORS.bg.light.primary,
      rowHoverColor: isDark
        ? THEME_COLORS.hover.dark
        : THEME_COLORS.hover.light,
      selectedRowBackgroundColor: isDark
        ? `${THEME_COLORS.primary}33`
        : `${THEME_COLORS.primary}22`,
    })
  }, [isDark])

  return (
    <div className="h-full">
      <AgGridReact<TData> ref={ref} theme={theme} {...props} />
    </div>
  )
}

const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: React.Ref<AgGridReact<TData>> }
) => React.ReactElement

export default Grid
