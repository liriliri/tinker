import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw, THEME_COLORS } from 'share/theme'
import {
  cloneCurves,
  getChannelColor,
  getChannelSwatchStyle,
  getCurvePath,
} from '../lib/curves'
import {
  computeHistogramFromCanvas,
  getChannelHistogram,
  getHistogramOpacity,
  getHistogramPath,
  type ChannelHistograms,
} from '../lib/histogram'
import store from '../store'
import type { CurveChannel, CurvePoint } from '../types'
import { CURVE_CHANNELS, getDefaultCurvePoints } from '../types/curves'

const CHANNEL_LABEL_KEYS: Record<CurveChannel, string> = {
  luma: 'curveChannelLuma',
  red: 'curveChannelRed',
  green: 'curveChannelGreen',
  blue: 'curveChannelBlue',
}

const CurveAdjustments = observer(function CurveAdjustments() {
  const { t } = useTranslation()
  const [activeChannel, setActiveChannel] = useState<CurveChannel>('luma')
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(
    null
  )
  const [localPoints, setLocalPoints] = useState<CurvePoint[] | null>(null)
  const [histogram, setHistogram] = useState<ChannelHistograms | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const activeChannelRef = useRef(activeChannel)
  const draggingIndexRef = useRef<number | null>(null)
  const localPointsRef = useRef<CurvePoint[] | null>(null)

  const activePoints = localPoints ?? store.adjustments.curves[activeChannel]
  const channelColor = getChannelColor(activeChannel)
  const histogramData = getChannelHistogram(histogram, activeChannel)
  const histogramPath = histogramData ? getHistogramPath(histogramData) : ''
  const histogramOpacity = getHistogramOpacity(store.isDark)
  const gridStroke = store.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const diagonalStroke = store.isDark
    ? 'rgba(255,255,255,0.2)'
    : 'rgba(0,0,0,0.15)'
  const pointStroke = store.isDark
    ? THEME_COLORS.bg.dark.primary
    : THEME_COLORS.bg.light.primary

  const updateHistogram = useMemo(
    () =>
      debounce((canvas: HTMLCanvasElement | null) => {
        if (!canvas) {
          setHistogram(null)
          return
        }
        setHistogram(computeHistogramFromCanvas(canvas))
      }, 80),
    []
  )

  useEffect(() => {
    void store.previewVersion
    updateHistogram(store.previewCanvas)
  }, [store.previewVersion, store.previewCanvas, updateHistogram])

  useEffect(() => {
    if (!store.hasImage) {
      setHistogram(null)
    }
  }, [store.hasImage])

  useEffect(() => {
    activeChannelRef.current = activeChannel
    setLocalPoints(null)
    setDraggingPointIndex(null)
  }, [activeChannel])

  useEffect(() => {
    if (draggingPointIndex === null) {
      setLocalPoints(null)
      localPointsRef.current = null
    }
  }, [store.adjustments.curves, activeChannel, draggingPointIndex])

  const updateCurves = useCallback(
    (channel: CurveChannel, points: CurvePoint[]) => {
      const curves = cloneCurves(store.adjustments.curves)
      curves[channel] = points.map((point) => ({ ...point }))
      store.patchAdjustments({ curves })
    },
    []
  )

  const resetActiveCurve = () => {
    const defaultPoints = getDefaultCurvePoints()
    setLocalPoints(defaultPoints)
    updateCurves(activeChannel, defaultPoints)
  }

  useEffect(() => {
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (draggingIndexRef.current === null) return

      const index = draggingIndexRef.current
      const currentPoints =
        localPointsRef.current ??
        store.adjustments.curves[activeChannelRef.current]
      const svg = svgRef.current
      if (!svg || !currentPoints) return

      const clientX =
        'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY =
        'touches' in event ? event.touches[0].clientY : event.clientY
      const rect = svg.getBoundingClientRect()

      let x = clamp(((clientX - rect.left) / rect.width) * 255, 0, 255)
      const y = clamp(255 - ((clientY - rect.top) / rect.height) * 255, 0, 255)

      const snapThreshold = 5
      if (x < snapThreshold) x = 0
      if (x > 255 - snapThreshold) x = 255

      const prevX = index > 0 ? currentPoints[index - 1].x : 0
      const nextX =
        index < currentPoints.length - 1 ? currentPoints[index + 1].x : 255
      const minX = index === 0 ? 0 : prevX + 0.01
      const maxX = index === currentPoints.length - 1 ? 255 : nextX - 0.01

      const newPoints = [...currentPoints]
      newPoints[index] = {
        x: clamp(x, minX, maxX),
        y,
      }

      localPointsRef.current = newPoints
      setLocalPoints(newPoints)
      updateCurves(activeChannelRef.current, newPoints)

      if ('cancelable' in event && event.cancelable) {
        event.preventDefault()
      }
    }

    const handleUp = () => {
      setDraggingPointIndex(null)
      draggingIndexRef.current = null
      localPointsRef.current = null
    }

    if (draggingPointIndex !== null) {
      window.addEventListener('mousemove', handleMove, { passive: false })
      window.addEventListener('mouseup', handleUp)
      window.addEventListener('touchmove', handleMove, { passive: false })
      window.addEventListener('touchend', handleUp)
      window.addEventListener('touchcancel', handleUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
      window.removeEventListener('touchcancel', handleUp)
    }
  }, [draggingPointIndex, updateCurves])

  const handlePointStart = (
    event: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    if ('button' in event && event.button === 2) return
    if (!('touches' in event)) event.preventDefault()
    event.stopPropagation()

    setLocalPoints(activePoints)
    localPointsRef.current = activePoints
    setDraggingPointIndex(index)
    draggingIndexRef.current = index
  }

  const handlePointContextMenu = (event: React.MouseEvent, index: number) => {
    if (index <= 0 || index >= activePoints.length - 1) return

    event.preventDefault()
    event.stopPropagation()
    const newPoints = activePoints.filter(
      (_, pointIndex) => pointIndex !== index
    )
    setLocalPoints(newPoints)
    localPointsRef.current = newPoints
    updateCurves(activeChannel, newPoints)
  }

  const handleContainerStart = (event: React.MouseEvent | React.TouchEvent) => {
    if (!('touches' in event) && event.button !== 0) return
    if ((event.target as HTMLElement).tagName === 'circle') return

    const svg = svgRef.current
    if (!svg) return

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY
    const rect = svg.getBoundingClientRect()
    const x = clamp(((clientX - rect.left) / rect.width) * 255, 0, 255)
    const y = clamp(255 - ((clientY - rect.top) / rect.height) * 255, 0, 255)

    const newPoints = [...activePoints, { x, y }].sort(
      (left, right) => left.x - right.x
    )
    const newPointIndex = newPoints.findIndex(
      (point) => point.x === x && point.y === y
    )

    setLocalPoints(newPoints)
    localPointsRef.current = newPoints
    updateCurves(activeChannel, newPoints)
    setDraggingPointIndex(newPointIndex)
    draggingIndexRef.current = newPointIndex
  }

  return (
    <div className="select-none touch-none">
      <div className="flex w-full gap-1 mb-2">
        {CURVE_CHANNELS.map((channel) => {
          const selected = activeChannel === channel
          const label = t(CHANNEL_LABEL_KEYS[channel])
          return (
            <button
              key={channel}
              type="button"
              className={`flex-1 h-5 rounded-sm transition-all ${
                selected
                  ? `ring-2 ring-offset-1 ring-offset-transparent ${tw.primary.border} opacity-100`
                  : 'opacity-45 hover:opacity-70'
              }`}
              style={getChannelSwatchStyle(channel)}
              onClick={() => setActiveChannel(channel)}
              title={label}
              aria-label={label}
            />
          )
        })}
      </div>

      <div
        className={`w-full aspect-square p-1 rounded-md relative touch-none ${tw.bg.input}`}
        onMouseDown={handleContainerStart}
        onTouchStart={handleContainerStart}
        onDoubleClick={resetActiveCurve}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 255 255"
          className="w-full h-full overflow-visible"
        >
          <path
            d="M 63.75,0 V 255 M 127.5,0 V 255 M 191.25,0 V 255 M 0,63.75 H 255 M 0,127.5 H 255 M 0,191.25 H 255"
            stroke={gridStroke}
            strokeWidth="0.5"
            fill="none"
          />
          {histogramPath && (
            <path
              d={histogramPath}
              fill={channelColor}
              opacity={histogramOpacity}
            />
          )}
          <line
            x1="0"
            y1="255"
            x2="255"
            y2="0"
            stroke={diagonalStroke}
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <path
            d={getCurvePath(activePoints)}
            fill="none"
            stroke={channelColor}
            strokeWidth="2.5"
          />
          {activePoints.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              className="cursor-pointer"
              cx={point.x}
              cy={255 - point.y}
              fill={channelColor}
              r="6"
              stroke={pointStroke}
              strokeWidth="2"
              onMouseDown={(event) => handlePointStart(event, index)}
              onTouchStart={(event) => handlePointStart(event, index)}
              onContextMenu={(event) => handlePointContextMenu(event, index)}
            />
          ))}
        </svg>
      </div>
    </div>
  )
})

export default CurveAdjustments
