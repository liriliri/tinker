import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import last from 'licia/last'
import clamp from 'licia/clamp'
import { X } from 'lucide-react'
import { tw, THEME_COLORS } from 'share/theme'
import type { MetricId } from '../../common/types'
import {
  formatMetricValue,
  getRingProgress,
  METRIC_ICONS,
} from '../lib/metricDisplay'
import { getHistoryValues, METRIC_COLORS } from '../lib/metrics'
import store from '../store'

interface FloatMonitorProps {
  onClose: () => void
}

const RING_METRICS: MetricId[] = ['cpu', 'memActive']
const NUMBER_METRICS: MetricId[] = ['netRx', 'netTx', 'diskRx', 'diskWx']

const RING_SIZE = 76
const RING_STROKE = 5

interface FloatMetricProps {
  id: MetricId
}

const FloatRing = observer(function FloatRing({ id }: FloatMetricProps) {
  const payload = store.payload
  const history = payload ? getHistoryValues(payload.history, id) : []
  const lastValue = history.length > 0 ? last(history) : 0
  const color = METRIC_COLORS[id]
  const Icon = METRIC_ICONS[id]
  const progress = getRingProgress(id, lastValue, history)
  const stats = formatMetricValue(id, lastValue)
  const trackColor = store.isDark
    ? THEME_COLORS.border.dark
    : THEME_COLORS.border.light

  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = clamp(progress, 0, 100)
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative shrink-0"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            strokeWidth={RING_STROKE}
            stroke={trackColor}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            strokeWidth={RING_STROKE}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.35s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={14} style={{ color }} strokeWidth={1.5} />
          <span
            className={`text-[11px] font-bold tabular-nums mt-0.5 ${tw.text.primary}`}
          >
            {stats}
          </span>
        </div>
      </div>
    </div>
  )
})

const FloatMetricValue = observer(function FloatMetricValue({
  id,
}: FloatMetricProps) {
  const { t } = useTranslation()
  const payload = store.payload
  const history = payload ? getHistoryValues(payload.history, id) : []
  const lastValue = history.length > 0 ? last(history) : 0
  const color = METRIC_COLORS[id]
  const Icon = METRIC_ICONS[id]
  const stats = formatMetricValue(id, lastValue)

  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-0">
      <div className={`flex items-center gap-1 ${tw.text.tertiary}`}>
        <Icon size={12} style={{ color }} strokeWidth={1.8} />
        <span className="text-[10px] font-bold uppercase tracking-wide truncate">
          {t(id)}
        </span>
      </div>
      <span className={`text-[13px] font-bold tabular-nums ${tw.text.primary}`}>
        {stats}
      </span>
    </div>
  )
})

export default observer(function FloatMonitor({ onClose }: FloatMonitorProps) {
  const { t } = useTranslation()

  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <div
        className={`flex items-center px-3 py-2 border-b ${tw.border}`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className={`text-sm font-medium ${tw.text.primary}`}>
          {t('floatTitle')}
        </span>
        <div className="flex-1" />
        <button
          className={`p-0.5 rounded ${tw.hover} ${tw.text.secondary}`}
          onClick={onClose}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
        <div className="grid grid-cols-2 gap-3">
          {RING_METRICS.map((id) => (
            <FloatRing key={id} id={id} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-1">
          {NUMBER_METRICS.map((id) => (
            <FloatMetricValue key={id} id={id} />
          ))}
        </div>
      </div>
    </div>
  )
})
