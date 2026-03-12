import { useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import clamp from 'licia/clamp'
import { THEME_COLORS } from 'share/theme'
import store from '../store'

interface VuMeterProps {
  leftAnalyser: AnalyserNode | null
  rightAnalyser: AnalyserNode | null
}

const VuMeter = observer(function VuMeter({
  leftAnalyser,
  rightAnalyser,
}: VuMeterProps) {
  const isDark = store.isDark
  const vuRafRef = useRef<number | null>(null)
  const leftBarRef = useRef<HTMLDivElement | null>(null)
  const rightBarRef = useRef<HTMLDivElement | null>(null)
  const leftPeakRef = useRef<HTMLDivElement | null>(null)
  const rightPeakRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!leftAnalyser || !rightAnalyser) return

    const bufLen = leftAnalyser.frequencyBinCount
    const leftData = new Float32Array(bufLen)
    const rightData = new Float32Array(bufLen)

    let leftLevel = 0
    let rightLevel = 0
    let leftPeak = 0
    let rightPeak = 0
    let leftPeakActive = false
    let rightPeakActive = false

    const toPct = (data: Float32Array) => {
      let peak = 0
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i])
        if (abs > peak) peak = abs
      }
      if (peak === 0) return 0
      const db = 20 * Math.log10(peak)
      return clamp(100 + db, 0, 100)
    }

    const draw = () => {
      vuRafRef.current = requestAnimationFrame(draw)
      leftAnalyser.getFloatTimeDomainData(leftData)
      rightAnalyser.getFloatTimeDomainData(rightData)

      const lPct = toPct(leftData)
      const rPct = toPct(rightData)

      leftLevel = lPct > leftLevel ? lPct : leftLevel + (lPct - leftLevel) / 4
      rightLevel =
        rPct > rightLevel ? rPct : rightLevel + (rPct - rightLevel) / 4

      if (lPct >= 100) {
        leftPeak = 100
        leftPeakActive = true
      } else if (leftLevel > leftPeak) {
        leftPeak = leftLevel
        leftPeakActive = false
      } else {
        leftPeak = clamp(leftPeak - 0.5, 0, 100)
        leftPeakActive = false
      }
      if (rPct >= 100) {
        rightPeak = 100
        rightPeakActive = true
      } else if (rightLevel > rightPeak) {
        rightPeak = rightLevel
        rightPeakActive = false
      } else {
        rightPeak = clamp(rightPeak - 0.5, 0, 100)
        rightPeakActive = false
      }

      if (leftBarRef.current) {
        leftBarRef.current.style.transform = `translate3d(${leftLevel}%,0,0)`
      }
      if (rightBarRef.current) {
        rightBarRef.current.style.transform = `translate3d(${rightLevel}%,0,0)`
      }
      if (leftPeakRef.current) {
        leftPeakRef.current.style.left = `${leftPeak}%`
        leftPeakRef.current.style.background = leftPeakActive ? '#ef4444' : ''
      }
      if (rightPeakRef.current) {
        rightPeakRef.current.style.left = `${rightPeak}%`
        rightPeakRef.current.style.background = rightPeakActive ? '#ef4444' : ''
      }
    }

    const reset = () => {
      leftLevel = 0
      rightLevel = 0
      leftPeak = 0
      rightPeak = 0
      if (leftBarRef.current)
        leftBarRef.current.style.transform = 'translate3d(0,0,0)'
      if (rightBarRef.current)
        rightBarRef.current.style.transform = 'translate3d(0,0,0)'
      if (leftPeakRef.current) leftPeakRef.current.style.left = '0%'
      if (rightPeakRef.current) rightPeakRef.current.style.left = '0%'
    }

    if (store.isPlaying) {
      draw()
    } else {
      if (vuRafRef.current !== null) {
        cancelAnimationFrame(vuRafRef.current)
        vuRafRef.current = null
      }
      reset()
    }

    return () => {
      if (vuRafRef.current !== null) {
        cancelAnimationFrame(vuRafRef.current)
        vuRafRef.current = null
      }
    }
  }, [store.isPlaying, leftAnalyser, rightAnalyser])

  const bgColor = isDark
    ? THEME_COLORS.bg.dark.secondary
    : THEME_COLORS.bg.light.secondary
  const borderColor = isDark
    ? THEME_COLORS.border.dark
    : THEME_COLORS.border.light

  return (
    <div className="flex flex-col gap-px mx-3 mb-1 mt-0">
      {[
        { barRef: leftBarRef, peakRef: leftPeakRef },
        { barRef: rightBarRef, peakRef: rightPeakRef },
      ].map(({ barRef, peakRef }, i) => (
        <div
          key={i}
          className="relative h-1 overflow-hidden"
          style={{
            background:
              'linear-gradient(to right, #22c55e 0%, #22c55e 54%, #eab308 85%, #ef4444 100%)',
          }}
        >
          <div
            ref={barRef}
            className="absolute inset-0"
            style={{
              transform: 'translate3d(0,0,0)',
              background: bgColor,
            }}
          />
          <div
            ref={peakRef}
            className="absolute top-0 h-full w-0.5"
            style={{
              left: '0%',
              background: borderColor,
            }}
          />
        </div>
      ))}
    </div>
  )
})

export default VuMeter
