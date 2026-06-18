import { useRef } from 'react'
import { tw } from 'share/theme'

interface ProgressBarProps {
  value: number
  max: number
  onChange: (value: number) => void
}

export function ProgressBar({ value, max, onChange }: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const percentage = max > 0 ? (value / max) * 100 : 0

  const handleClick = (e: React.MouseEvent) => {
    if (!trackRef.current || max <= 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    onChange(ratio * max)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current || max <= 0) return
    handleClick(e)

    const handleMouseMove = (ev: MouseEvent) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      onChange(ratio * max)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={trackRef}
      className="group relative h-3 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      <div
        className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 ${tw.bg.input}`}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-0.5 ${tw.primary.bg} pointer-events-none`}
        style={{ width: `${percentage}%` }}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${tw.primary.bg} shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
        style={{ left: `calc(${percentage}% - 5px)` }}
      />
    </div>
  )
}

interface VolumeBarProps {
  value: number
  onChange: (value: number) => void
}

export function VolumeBar({ value, onChange }: VolumeBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const percentage = value * 100

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return
    const update = (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      onChange(ratio)
    }

    update(e.clientX)

    const handleMouseMove = (ev: MouseEvent) => update(ev.clientX)
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={trackRef}
      className={`group relative h-1 w-20 rounded-full ${tw.bg.input} cursor-pointer`}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`absolute h-full rounded-full ${tw.primary.bg} pointer-events-none`}
        style={{ width: `${percentage}%` }}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${tw.primary.bg} shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
        style={{ left: `calc(${percentage}% - 5px)` }}
      />
    </div>
  )
}
