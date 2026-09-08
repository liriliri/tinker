import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import { THEME_COLORS, tw } from 'share/theme'
import { Folder, Globe, Monitor, Package, Plus, Terminal } from 'lucide-react'
import type { SlotAction, Slots } from '../types'
import { SLOT_COUNT } from '../types'
import {
  actionUsesIcon,
  donutSlicePath,
  polarToCartesian,
  slotAngles,
} from '../lib/util'
import store from '../store'

interface PieMenuViewProps {
  slots: Slots
  selectedIndex?: number | null
  onSelectSlot?: (index: number) => void
  onCenterClick?: () => void
  size?: number
  centerDraggable?: boolean
}

interface SlotGlyphProps {
  action: SlotAction | null
  selected: boolean
}

function SlotGlyph({ action, selected }: SlotGlyphProps) {
  const iconClass = selected ? tw.primary.text : tw.text.secondary
  if (!action) {
    return (
      <Plus
        size={14}
        className={selected ? tw.primary.text : tw.text.tertiary}
      />
    )
  }
  if (actionUsesIcon(action.type) && action.appIcon) {
    return (
      <img
        src={fileUrl(action.appIcon)}
        alt=""
        className="w-5 h-5 rounded"
        draggable={false}
      />
    )
  }
  if (action.type === 'app') {
    return <Monitor size={14} className={iconClass} />
  }
  if (action.type === 'plugin') {
    return <Package size={14} className={iconClass} />
  }
  if (action.type === 'directory') {
    return <Folder size={14} className={iconClass} />
  }
  if (action.type === 'url') {
    return <Globe size={14} className={iconClass} />
  }
  return <Terminal size={14} className={iconClass} />
}

export default observer(function PieMenuView({
  slots,
  selectedIndex = null,
  onSelectSlot,
  onCenterClick,
  size = 280,
  centerDraggable = false,
}: PieMenuViewProps) {
  const { t } = useTranslation()
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.46
  const innerR = size * 0.18
  const iconR = (innerR + outerR) / 2
  const mode = store.isDark ? 'dark' : 'light'
  const sliceFill = THEME_COLORS.bg[mode].primary
  const selectedFill = `${THEME_COLORS.primary}33`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: SLOT_COUNT }, (_, index) => {
          const { start, end, mid } = slotAngles(index)
          const action = slots[index]
          const selected = selectedIndex === index
          const disabled = action ? !action.enabled : false
          const pos = polarToCartesian(cx, cy, iconR, mid)

          return (
            <g key={index} opacity={disabled ? 0.45 : 1}>
              <path
                d={donutSlicePath(cx, cy, innerR, outerR, start, end)}
                className="cursor-pointer"
                fill={selected ? selectedFill : sliceFill}
                stroke={
                  selected ? THEME_COLORS.primary : THEME_COLORS.border[mode]
                }
                strokeWidth={selected ? 2 : 1}
                onClick={() => onSelectSlot?.(index)}
              />
              <foreignObject
                x={pos.x - 18}
                y={pos.y - 18}
                width={36}
                height={36}
                className="pointer-events-none overflow-visible"
              >
                <div className="w-9 h-9 flex flex-col items-center justify-center gap-0.5">
                  <SlotGlyph action={action} selected={selected} />
                  {action && (
                    <span
                      className={`text-[9px] leading-none max-w-[36px] truncate ${
                        selected ? tw.primary.text : tw.text.secondary
                      }`}
                    >
                      {action.name}
                    </span>
                  )}
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>
      <button
        type="button"
        className={`absolute rounded-full flex items-center justify-center border-2 shadow-md ${
          tw.primary.border
        } ${tw.bg.primary} ${
          onCenterClick ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{
          width: innerR * 2,
          height: innerR * 2,
          left: cx - innerR,
          top: cy - innerR,
          ...(centerDraggable
            ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties)
            : {}),
        }}
        onClick={onCenterClick}
      >
        <span className={`text-xs font-semibold ${tw.primary.text}`}>
          {t('pieCenter')}
        </span>
      </button>
    </div>
  )
})
