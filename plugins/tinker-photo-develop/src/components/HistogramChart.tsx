import { observer } from 'mobx-react-lite'
import easing from 'licia/easing'
import { useCallback, useEffect, useRef, useState } from 'react'
import { tw } from 'share/theme'
import {
  computeHistogramFromCanvas,
  getRgbHistogramLayers,
  HISTOGRAM_TRANSITION_MS,
  lerpChannelHistograms,
  type ChannelHistograms,
} from '../lib/histogram'
import store from '../store'

const HistogramChart = observer(function HistogramChart() {
  const [displayed, setDisplayed] = useState<ChannelHistograms | null>(null)
  const displayedRef = useRef<ChannelHistograms | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const animFromRef = useRef<ChannelHistograms | null>(null)
  const animStartRef = useRef(0)

  const cancelAnimation = useCallback(() => {
    if (animFrameRef.current === null) return
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = null
  }, [])

  const startTransition = useCallback(
    (target: ChannelHistograms) => {
      cancelAnimation()

      const from = displayedRef.current ?? target
      animFromRef.current = from
      animStartRef.current = performance.now()

      const tick = (now: number) => {
        const fromSnapshot = animFromRef.current
        if (!fromSnapshot) return

        const progress = easing.outCubic(
          Math.min(1, (now - animStartRef.current) / HISTOGRAM_TRANSITION_MS)
        )
        const next =
          progress >= 1
            ? target
            : lerpChannelHistograms(fromSnapshot, target, progress)

        displayedRef.current = next
        setDisplayed(next)

        if (progress >= 1) {
          animFrameRef.current = null
          return
        }

        animFrameRef.current = requestAnimationFrame(tick)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    },
    [cancelAnimation]
  )

  useEffect(() => {
    void store.previewVersion
    const canvas = store.previewCanvas
    if (!canvas) {
      cancelAnimation()
      displayedRef.current = null
      setDisplayed(null)
      return
    }

    const target = computeHistogramFromCanvas(canvas)
    if (!target) return

    if (!displayedRef.current) {
      displayedRef.current = target
      setDisplayed(target)
      return
    }

    startTransition(target)
  }, [store.previewVersion, store.previewCanvas, startTransition, cancelAnimation])

  useEffect(() => {
    if (!store.hasImage) {
      cancelAnimation()
      displayedRef.current = null
      setDisplayed(null)
    }
  }, [store.hasImage, cancelAnimation])

  useEffect(() => cancelAnimation, [cancelAnimation])

  const layers = displayed ? getRgbHistogramLayers(displayed) : []

  return (
    <div
      className={`shrink-0 border-b px-3 py-3 ${tw.border} ${tw.bg.secondary}`}
    >
      <div className={`relative h-28 overflow-hidden rounded ${tw.bg.primary}`}>
        {layers.length > 0 ? (
          <svg
            viewBox="0 0 255 255"
            className="h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            {layers.map((layer) => (
              <g key={layer.key} style={{ mixBlendMode: 'lighten' }}>
                <path d={layer.fillPath} fill={layer.color} fillOpacity={0.4} />
                <path
                  d={layer.linePath}
                  fill="none"
                  stroke={layer.color}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </svg>
        ) : (
          <div
            className={`flex h-full items-center justify-center ${tw.text.secondary}`}
          >
            <div className="h-px w-3/4 bg-current opacity-20" />
          </div>
        )}
      </div>
    </div>
  )
})

export default HistogramChart
