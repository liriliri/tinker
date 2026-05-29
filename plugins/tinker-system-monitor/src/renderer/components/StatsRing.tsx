import type { LucideIcon } from 'lucide-react'
import clamp from 'licia/clamp'
import { tw } from 'share/theme'
import { CARD_LAYOUT, type CardSize } from '../lib/cardLayout'

interface StatsRingProps {
  label: string
  stats: string
  progress: number
  color: string
  trackColor: string
  Icon: LucideIcon
  detail?: string
  size?: CardSize
}

export default function StatsRing({
  label,
  stats,
  progress,
  color,
  trackColor,
  Icon,
  detail,
  size = 'sm',
}: StatsRingProps) {
  const layout = CARD_LAYOUT[size]
  const ringSize = layout.ring
  const stroke = layout.stroke
  const radius = (ringSize - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = clamp(progress, 0, 100)
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-w-0 px-0.5 ${
        size === 'lg' ? 'gap-1' : 'gap-0.5'
      }`}
    >
      <span
        className={`${layout.labelClass} font-bold uppercase tracking-wide ${tw.text.tertiary} text-center leading-tight line-clamp-2`}
        title={label}
      >
        {label}
      </span>
      <div
        className="relative shrink-0"
        style={{ width: ringSize, height: ringSize }}
      >
        <svg width={ringSize} height={ringSize} className="-rotate-90">
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke={trackColor}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.35s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={layout.icon} style={{ color }} strokeWidth={1.5} />
          <span
            className={`${layout.statsClass} font-bold tabular-nums mt-px ${tw.text.primary}`}
          >
            {stats}
          </span>
        </div>
      </div>
      {detail && (
        <span
          className={`${layout.detailClass} ${tw.text.tertiary} text-center truncate max-w-full`}
          title={detail}
        >
          {detail}
        </span>
      )}
    </div>
  )
}
