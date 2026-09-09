import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import fileUrl from 'licia/fileUrl'
import { THEME_COLORS, tw } from 'share/theme'
import { Plus } from 'lucide-react'
import {
  INNER_RING_RATIO,
  INNER_SLOT_COUNT,
  OUTER_RING_RATIO,
  OUTER_SLOT_COUNT,
  PIE_SIZE,
  RING_ANIM_MS,
  pieCanvasSize,
  type SlotAction,
  type SlotRing,
  type Slots,
} from '../types'
import {
  actionUsesIcon,
  donutSlicePath,
  polarToCartesian,
  slotAngles,
} from '../lib/util'
import store from '../store'
import ActionTypeIcon from './ActionTypeIcon'
import FlowOrb from './FlowOrb'

interface PieMenuViewProps {
  slots: Slots
  outerSlots?: Slots
  dualRing?: boolean
  selectedIndex?: number | null
  selectedRing?: SlotRing
  onSelectSlot?: (index: number, ring: SlotRing) => void
  size?: number
  ringVisible?: boolean
  showCenter?: boolean
  ballDraggable?: boolean
  ballPressed?: boolean
  /** Scale sector icons on hover (floating pie only). */
  iconHoverScale?: boolean
}

interface SlotGlyphProps {
  action: SlotAction | null
  active: boolean
  hovered: boolean
  compact?: boolean
  iconHoverScale?: boolean
}

function SlotGlyph({
  action,
  active,
  hovered,
  compact,
  iconHoverScale,
}: SlotGlyphProps) {
  const iconSize = compact ? 17 : 18
  const imgClass = compact ? 'w-6 h-6' : 'w-7 h-7'
  const iconClass = active ? tw.primary.text : tw.text.secondary
  let glyph
  if (!action) {
    glyph = (
      <Plus
        size={iconSize}
        className={active ? tw.primary.text : tw.text.tertiary}
      />
    )
  } else if (actionUsesIcon(action.type) && action.appIcon) {
    glyph = (
      <img
        src={fileUrl(action.appIcon)}
        alt=""
        className={`${imgClass} rounded`}
        draggable={false}
      />
    )
  } else {
    glyph = (
      <ActionTypeIcon
        type={action.type}
        size={iconSize}
        className={iconClass}
      />
    )
  }
  if (!iconHoverScale) return glyph
  return (
    <span
      className="inline-flex"
      style={{
        transform: hovered ? 'scale(1.25)' : 'scale(1)',
        transition: `transform ${RING_ANIM_MS}ms ease`,
      }}
    >
      {glyph}
    </span>
  )
}

interface RingSectorProps {
  index: number
  count: number
  ring: SlotRing
  action: SlotAction | null
  cx: number
  cy: number
  innerR: number
  outerR: number
  selected: boolean
  hovered: boolean
  compact?: boolean
  sliceFill: string
  selectedFill: string
  hoverFill: string
  iconHoverScale?: boolean
  onHover: (index: number | null) => void
  onSelect?: (index: number, ring: SlotRing) => void
}

function RingSector({
  index,
  count,
  ring,
  action,
  cx,
  cy,
  innerR,
  outerR,
  selected,
  hovered,
  compact,
  sliceFill,
  selectedFill,
  hoverFill,
  iconHoverScale,
  onHover,
  onSelect,
}: RingSectorProps) {
  const { start, end, mid } = slotAngles(index, count)
  const active = selected || hovered
  const disabled = action ? !action.enabled : false
  const iconR = (innerR + outerR) / 2
  const pos = polarToCartesian(cx, cy, iconR, mid)
  const box = compact ? 40 : 48
  const boxH = compact ? 46 : 56
  const half = box / 2

  return (
    <g opacity={disabled ? 0.45 : 1}>
      <path
        d={donutSlicePath(cx, cy, innerR, outerR, start, end)}
        className="cursor-pointer"
        style={{
          fill: selected ? selectedFill : hovered ? hoverFill : sliceFill,
          stroke: 'none',
          transition: `fill ${RING_ANIM_MS}ms ease`,
        }}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(index, ring)
        }}
      />
      <foreignObject
        x={pos.x - half}
        y={pos.y - boxH / 2}
        width={box}
        height={boxH}
        className="pointer-events-none overflow-visible"
      >
        <div
          className={`flex flex-col items-center justify-center ${
            compact ? 'w-10 h-[46px] gap-1' : 'w-12 h-[56px] gap-2'
          }`}
        >
          <SlotGlyph
            action={action}
            active={active}
            hovered={hovered}
            compact={compact}
            iconHoverScale={iconHoverScale}
          />
          {action && (
            <span
              className={`leading-none truncate ${
                compact ? 'text-[8px] max-w-[40px]' : 'text-[9px] max-w-[48px]'
              } ${active ? tw.primary.text : tw.text.secondary}`}
              style={{ transition: `color ${RING_ANIM_MS}ms ease` }}
            >
              {action.name}
            </span>
          )}
        </div>
      </foreignObject>
    </g>
  )
}

export default observer(function PieMenuView({
  slots,
  outerSlots,
  dualRing = false,
  selectedIndex = null,
  selectedRing = 'inner',
  onSelectSlot,
  size = PIE_SIZE,
  ringVisible = true,
  showCenter = true,
  ballDraggable = false,
  ballPressed = false,
  iconHoverScale = false,
}: PieMenuViewProps) {
  const [hovered, setHovered] = useState<{
    ring: SlotRing
    index: number
  } | null>(null)
  const canvas = pieCanvasSize(dualRing, size)
  const cx = canvas / 2
  const cy = canvas / 2
  const centerR = size * 0.08
  const holeR = size * 0.17
  const midR = size * INNER_RING_RATIO
  const rimR = dualRing ? midR + size * OUTER_RING_RATIO : midR
  const mode = store.isDark ? 'dark' : 'light'
  const baseBg =
    mode === 'dark'
      ? THEME_COLORS.bg.dark.select
      : THEME_COLORS.bg.light.primary
  const sliceFill =
    mode === 'dark'
      ? THEME_COLORS.bg.dark.select
      : THEME_COLORS.bg.light.tertiary
  const selectedFill = `color-mix(in srgb, ${THEME_COLORS.primary} 32%, ${baseBg})`
  const hoverFill = `color-mix(in srgb, ${THEME_COLORS.primary} 22%, ${baseBg})`
  const centerSize = centerR * 2

  return (
    <div className="relative" style={{ width: canvas, height: canvas }}>
      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          ringVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ transitionDuration: `${RING_ANIM_MS}ms` }}
      >
        <svg width={canvas} height={canvas} viewBox={`0 0 ${canvas} ${canvas}`}>
          {Array.from({ length: INNER_SLOT_COUNT }, (_, index) => (
            <RingSector
              key={`inner-${index}`}
              index={index}
              count={INNER_SLOT_COUNT}
              ring="inner"
              action={slots[index]}
              cx={cx}
              cy={cy}
              innerR={holeR}
              outerR={midR}
              selected={selectedRing === 'inner' && selectedIndex === index}
              hovered={hovered?.ring === 'inner' && hovered.index === index}
              sliceFill={sliceFill}
              selectedFill={selectedFill}
              hoverFill={hoverFill}
              iconHoverScale={iconHoverScale}
              onHover={(i) =>
                setHovered(i == null ? null : { ring: 'inner', index: i })
              }
              onSelect={onSelectSlot}
            />
          ))}
          {dualRing &&
            Array.from({ length: OUTER_SLOT_COUNT }, (_, index) => (
              <RingSector
                key={`outer-${index}`}
                index={index}
                count={OUTER_SLOT_COUNT}
                ring="outer"
                action={outerSlots?.[index] ?? null}
                cx={cx}
                cy={cy}
                innerR={midR}
                outerR={rimR}
                selected={selectedRing === 'outer' && selectedIndex === index}
                hovered={hovered?.ring === 'outer' && hovered.index === index}
                compact
                sliceFill={sliceFill}
                selectedFill={selectedFill}
                hoverFill={hoverFill}
                iconHoverScale={iconHoverScale}
                onHover={(i) =>
                  setHovered(i == null ? null : { ring: 'outer', index: i })
                }
                onSelect={onSelectSlot}
              />
            ))}
          {dualRing && (
            <circle
              cx={cx}
              cy={cy}
              r={midR}
              fill="none"
              stroke={THEME_COLORS.border[mode]}
              strokeWidth={1}
              className="pointer-events-none"
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={rimR}
            fill="none"
            stroke={THEME_COLORS.border[mode]}
            strokeWidth={1}
            className="pointer-events-none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={holeR}
            fill="none"
            stroke={THEME_COLORS.border[mode]}
            strokeWidth={1}
            className="pointer-events-none"
          />
        </svg>
      </div>
      {showCenter && (
        <FlowOrb
          size={centerSize}
          className="absolute"
          style={{
            left: cx - centerR,
            top: cy - centerR,
          }}
          draggable={ballDraggable}
          pressed={ballPressed}
        />
      )}
    </div>
  )
})
