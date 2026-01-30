import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  MousePointer2,
  Hand,
  Square,
  Pencil,
  Type,
  Search,
  Repeat2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { THEME_COLORS, tw } from 'share/theme'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import store, { ToolType } from '../store'
import MosaicIcon from '../assets/mosaic.svg?react'

const SIDE_TOOL_DEFS: Array<{
  id: ToolType
  icon: LucideIcon
  labelKey: string
}> = [
  { id: 'select', icon: MousePointer2, labelKey: 'select' },
  { id: 'move', icon: Hand, labelKey: 'move' },
  { id: 'pen', icon: Pencil, labelKey: 'pen' },
  { id: 'shape', icon: Square, labelKey: 'shape' },
  { id: 'magnifier', icon: Search, labelKey: 'magnifier' },
]

export default observer(function SideToolbar() {
  const { t } = useTranslation()

  return (
    <div
      className={`w-12 flex flex-col items-center py-3 border-r ${tw.border.both} ${tw.bg.both.tertiary}`}
    >
      {SIDE_TOOL_DEFS.map((tool) => {
        const Icon = tool.icon
        return (
          <ToolbarButton
            key={tool.id}
            variant="toggle"
            active={store.tool === tool.id}
            onClick={() => store.setTool(tool.id)}
            disabled={false}
            title={t(tool.labelKey)}
            className="mb-2"
          >
            <Icon size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        )
      })}
      <ToolbarButton
        variant="toggle"
        active={store.tool === 'mosaic'}
        onClick={() => store.setTool('mosaic')}
        disabled={false}
        title={t('mosaic')}
        className="mb-2"
      >
        <MosaicIcon
          width={TOOLBAR_ICON_SIZE}
          height={TOOLBAR_ICON_SIZE}
          className="fill-current"
        />
      </ToolbarButton>
      <ToolbarButton
        variant="toggle"
        active={store.tool === 'text'}
        onClick={() => store.setTool('text')}
        disabled={false}
        title={t('text')}
        className="mb-4"
      >
        <Type size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <div className="mt-4 flex w-full flex-col items-center gap-2">
        <div className="relative h-9 w-9 mx-auto">
          <button
            type="button"
            onClick={() => store.swapColors()}
            disabled={false}
            className="absolute -top-2 -right-1 p-1 disabled:opacity-40"
            title={t('swapColors')}
          >
            <Repeat2 size={12} />
          </button>
          <div
            className={`absolute left-1 top-1 h-5 w-5 shadow-md z-10 p-[1px]`}
            style={{
              backgroundColor: THEME_COLORS.bg.light.primary,
              border: `1px solid ${THEME_COLORS.text.light.primary}`,
            }}
          >
            <input
              type="color"
              value={store.foregroundColor}
              onChange={(event) => store.setForegroundColor(event.target.value)}
              disabled={false}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              title={t('foreground')}
            />
            <div
              className="h-full w-full"
              style={{ backgroundColor: store.foregroundColor }}
            />
          </div>
          <div
            className={`absolute left-4 top-4 h-5 w-5 shadow-sm z-0 p-[1px]`}
            style={{
              backgroundColor: THEME_COLORS.bg.light.primary,
              border: `1px solid ${THEME_COLORS.text.light.primary}`,
            }}
          >
            <input
              type="color"
              value={store.backgroundColor}
              onChange={(event) => store.setBackgroundColor(event.target.value)}
              disabled={false}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              title={t('background')}
            />
            <div
              className="h-full w-full"
              style={{ backgroundColor: store.backgroundColor }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
