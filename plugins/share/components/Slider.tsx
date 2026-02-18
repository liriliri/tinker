import { useRef, useState, useEffect } from 'react'
import { tw } from 'share/theme'

interface SliderProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

const Slider = ({
  value,
  min,
  max,
  onChange,
  disabled = false,
}: SliderProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const percentage = ((value - min) / (max - min)) * 100

  const updateValue = (clientX: number) => {
    if (!trackRef.current || disabled) return

    const rect = trackRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newValue = Math.round(min + percentage * (max - min))

    onChange(newValue)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    updateValue(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      updateValue(e.clientX)
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
  }, [isDragging, min, max, onChange, disabled])

  return (
    <div
      ref={trackRef}
      className={`relative h-1.5 rounded-full ${tw.bg.secondary} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`absolute h-full rounded-full ${tw.primary.bg} pointer-events-none`}
        style={{ width: `${percentage}%` }}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
          tw.primary.bg
        } border-2 ${tw.bg.primary} shadow-md transition-transform ${
          isDragging ? 'scale-110' : 'hover:scale-110'
        } ${
          disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  )
}

export default Slider
