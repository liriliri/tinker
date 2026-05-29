import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import contain from 'licia/contain'
import last from 'licia/last'
import { LoadingCircle } from 'share/components/Loading'
import { tw, THEME_COLORS } from 'share/theme'
import type { MetricId } from '../../common/types'
import { CARD_LAYOUT } from '../lib/cardLayout'
import { drawLineChart } from '../lib/chart'
import {
  formatMetricValue,
  getMetricDetail,
  getRingProgress,
  METRIC_ICONS,
} from '../lib/metricDisplay'
import { getHistoryValues, METRIC_COLORS } from '../lib/metrics'
import { useCardSize } from '../lib/useCardSize'
import store from '../store'
import StatsRing from './StatsRing'

interface MetricPanelProps {
  id: MetricId
}

const RING_LESS_METRICS: MetricId[] = ['netRx', 'netTx', 'diskRx', 'diskWx']

const MetricPanel = observer(function MetricPanel({ id }: MetricPanelProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardSize = useCardSize(cardRef)
  const layout = CARD_LAYOUT[cardSize]
  const payload = store.payload
  const showRing = !contain(RING_LESS_METRICS, id)

  const history = payload ? getHistoryValues(payload.history, id) : []
  const lastValue = history.length > 0 ? last(history) : 0
  const color = METRIC_COLORS[id]
  const Icon = METRIC_ICONS[id]
  const detail = getMetricDetail(id, payload?.current)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || history.length < 2) return

    const isDark = store.isDark
    const textPrimary = isDark
      ? THEME_COLORS.text.dark.primary
      : THEME_COLORS.text.light.primary
    const bg = isDark
      ? THEME_COLORS.bg.dark.primary
      : THEME_COLORS.bg.light.primary

    drawLineChart(canvas, {
      id,
      history,
      color,
      fgColor: textPrimary,
      bgColor: bg,
      formatLabel: (v) => formatMetricValue(id, v),
    })
  }, [id, history, color, store.isDark, cardSize])

  const progress = getRingProgress(id, lastValue, history)
  const stats = formatMetricValue(id, lastValue)

  return (
    <div
      ref={cardRef}
      style={{ height: layout.height }}
      className={`${tw.bg.tertiary} ${tw.border} border rounded-lg shadow-sm flex overflow-hidden min-w-0`}
    >
      {showRing && (
        <div
          style={{ width: layout.ringCol }}
          className={`shrink-0 flex items-center justify-center min-w-0 ${tw.border} border-r`}
        >
          <StatsRing
            label={t(id)}
            stats={stats}
            progress={progress}
            color={color}
            trackColor={
              store.isDark
                ? THEME_COLORS.border.dark
                : THEME_COLORS.border.light
            }
            Icon={Icon}
            detail={detail}
            size={cardSize}
          />
        </div>
      )}
      <div
        className={`flex-1 min-w-0 ${layout.chartPad} flex flex-col relative`}
      >
        {!showRing && (
          <div
            className={`absolute top-1 left-1.5 flex items-center gap-1 ${tw.text.tertiary} pointer-events-none`}
          >
            <Icon size={12} style={{ color }} strokeWidth={1.8} />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {t(id)}
            </span>
          </div>
        )}
        {history.length < 2 ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingCircle className="w-6 h-6" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="flex-1 w-full min-h-0 block" />
        )}
      </div>
    </div>
  )
})

export default MetricPanel
