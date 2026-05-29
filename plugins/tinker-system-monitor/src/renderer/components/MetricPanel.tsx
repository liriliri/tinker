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

const MetricPanel = observer(function MetricPanel({ id }: MetricPanelProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardSize = useCardSize(cardRef)
  const layout = CARD_LAYOUT[cardSize]
  const payload = store.payload
  const unavailable = contain(payload?.unavailableMetrics ?? [], id)

  const history = payload ? getHistoryValues(payload.history, id) : []
  const lastValue = history.length > 0 ? last(history) : 0
  const color = METRIC_COLORS[id]
  const Icon = METRIC_ICONS[id]
  const detail = getMetricDetail(id, payload?.current)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || unavailable || history.length < 2) return

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
  }, [id, history, unavailable, color, store.isDark, cardSize])

  if (unavailable) {
    return null
  }

  const progress = getRingProgress(id, lastValue, history)
  const stats = formatMetricValue(id, lastValue)

  return (
    <div
      ref={cardRef}
      style={{ height: layout.height }}
      className={`${tw.bg.primary} ${tw.border} border rounded-lg shadow-sm flex overflow-hidden min-w-0`}
    >
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
            store.isDark ? THEME_COLORS.border.dark : THEME_COLORS.border.light
          }
          Icon={Icon}
          detail={detail}
          size={cardSize}
        />
      </div>
      <div className={`flex-1 min-w-0 ${layout.chartPad} flex flex-col`}>
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
