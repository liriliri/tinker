import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import isEqual from 'licia/isEqual'
import { THEME_COLORS } from 'share/theme'
import type { DataPoint, MetricId } from '../../common/types'
import { drawStreamingChart } from '../lib/chart'
import { historyToSamples, type MetricSample } from '../lib/metrics'

interface ChartAnimationOptions {
  id: MetricId
  history: DataPoint[]
  color: string
  refreshInterval: number
  paused: boolean
  isDark: boolean
  formatLabel: (value: number) => string
}

export function useChartAnimationLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: ChartAnimationOptions
): void {
  const bufferRef = useRef<MetricSample[]>([])
  const curMaxRef = useRef(0)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useLayoutEffect(() => {
    const next = historyToSamples(
      options.history,
      options.id,
      options.refreshInterval
    )
    if (!isEqual(bufferRef.current, next)) {
      bufferRef.current = next
    }
  }, [options.history, options.id, options.refreshInterval])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || options.history.length < 2) return

    let raf = 0

    const paint = () => {
      const opts = optionsRef.current
      const textPrimary = opts.isDark
        ? THEME_COLORS.text.dark.primary
        : THEME_COLORS.text.light.primary
      const bg = opts.isDark
        ? THEME_COLORS.bg.dark.primary
        : THEME_COLORS.bg.light.primary

      const result = drawStreamingChart(canvas, {
        id: opts.id,
        buffer: bufferRef.current,
        color: opts.color,
        fgColor: textPrimary,
        bgColor: bg,
        formatLabel: opts.formatLabel,
        curMax: curMaxRef.current,
      })
      curMaxRef.current = result.curMax

      if (!opts.paused) {
        raf = requestAnimationFrame(paint)
      }
    }

    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [
    canvasRef,
    options.history.length,
    options.refreshInterval,
    options.paused,
    options.id,
    options.color,
    options.isDark,
    options.formatLabel,
  ])
}
