import clamp from 'licia/clamp'
import precision from 'licia/precision'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'

interface AdjustmentSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  defaultValue?: number
  trackClassName?: string
  onChange: (value: number) => void
}

function snapValue(
  raw: number,
  min: number,
  max: number,
  step: number,
  decimalPlaces: number
): number {
  const stepped = Math.round(raw / step) * step
  const clamped = clamp(stepped, min, max)
  return parseFloat(clamped.toFixed(decimalPlaces))
}

const AdjustmentSlider = ({
  label,
  value,
  min,
  max,
  step,
  defaultValue = 0,
  trackClassName,
  onChange,
}: AdjustmentSliderProps) => {
  const { t } = useTranslation()
  const [isValueHovered, setIsValueHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const decimalPlaces = precision(step)

  const fillOrigin =
    defaultValue >= min && defaultValue <= max ? defaultValue : min
  const percentage = max !== min ? ((value - min) / (max - min)) * 100 : 0
  const originPercentage =
    max !== min ? ((fillOrigin - min) / (max - min)) * 100 : 0

  const handleReset = useCallback(() => {
    onChange(defaultValue)
  }, [defaultValue, onChange])

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value

      const rect = track.getBoundingClientRect()
      const x = clientX - rect.left
      const ratio = clamp(x / rect.width, 0, 1)
      const raw = min + ratio * (max - min)

      return snapValue(raw, min, max, step, decimalPlaces)
    },
    [decimalPlaces, max, min, step, value]
  )

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    const nextValue = valueFromClientX(event.clientX)
    if (nextValue !== value) {
      onChange(nextValue)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      const nextValue = valueFromClientX(event.clientX)
      if (nextValue !== value) {
        onChange(nextValue)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onChange, value, valueFromClientX])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return

      event.preventDefault()
      const direction = -Math.sign(event.deltaY || event.deltaX)
      const nextValue = snapValue(
        value + direction * step,
        min,
        max,
        step,
        decimalPlaces
      )

      if (nextValue !== value) {
        onChange(nextValue)
      }
    }

    track.addEventListener('wheel', handleWheel, { passive: false })
    return () => track.removeEventListener('wheel', handleWheel)
  }, [decimalPlaces, max, min, onChange, step, value])

  return (
    <div className="mb-3 group">
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm select-none ${tw.text.primary}`}>
          {label}
        </span>
        <div
          className="grid w-12 cursor-pointer"
          onClick={handleReset}
          onDoubleClick={handleReset}
          onMouseEnter={() => setIsValueHovered(true)}
          onMouseLeave={() => setIsValueHovered(false)}
        >
          <span
            aria-hidden={isValueHovered}
            className={`col-start-1 row-start-1 text-sm text-right select-none transition-opacity duration-200 ${
              tw.text.secondary
            } ${isValueHovered ? 'opacity-0' : 'opacity-100'}`}
          >
            {value.toFixed(decimalPlaces)}
          </span>
          <span
            aria-hidden={!isValueHovered}
            className={`col-start-1 row-start-1 text-sm text-right select-none transition-opacity duration-200 pointer-events-none ${
              tw.text.primary
            } ${isValueHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            {t('reset')}
          </span>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`relative h-1.5 rounded-full cursor-pointer ${
          trackClassName || tw.bg.input
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleReset}
      >
        <div
          className={`absolute h-full rounded-full ${tw.primary.bg} opacity-25 pointer-events-none`}
          style={{
            left: `${Math.min(percentage, originPercentage)}%`,
            width: `${Math.abs(percentage - originPercentage)}%`,
          }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
            tw.primary.bg
          } border-2 ${tw.bg.primary} shadow-md transition-transform ${
            isDragging ? 'scale-110' : 'hover:scale-110'
          } cursor-grab active:cursor-grabbing`}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  )
}

export default AdjustmentSlider
