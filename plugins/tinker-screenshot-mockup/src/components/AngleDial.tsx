import { useEffect, useRef, useState } from 'react'
import className from 'licia/className'
import { tw } from 'share/theme'

interface AngleDialProps {
  value: number
  onChange: (angle: number) => void
}

function angleFromPoint(
  el: HTMLElement,
  clientX: number,
  clientY: number
): number {
  const rect = el.getBoundingClientRect()
  const dx = clientX - (rect.left + rect.width / 2)
  const dy = clientY - (rect.top + rect.height / 2)
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
  if (deg < 0) deg += 360
  return Math.round(deg) % 360
}

export default function AngleDial({ value, onChange }: AngleDialProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => {
      const el = dialRef.current
      if (!el) return
      onChange(angleFromPoint(el, e.clientX, e.clientY))
    }
    const onUp = () => setDragging(false)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragging, onChange])

  return (
    <div
      ref={dialRef}
      className={className(
        'relative h-16 w-16 shrink-0 rounded-full border select-none',
        tw.border,
        dragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      onMouseDown={(e) => {
        e.preventDefault()
        const el = dialRef.current
        if (!el) return
        setDragging(true)
        onChange(angleFromPoint(el, e.clientX, e.clientY))
      }}
    >
      {/* Default bar points down; +180 maps 0° to “to top”, matching CSS gradients. */}
      <div
        className={`absolute left-1/2 top-1/2 h-1/2 w-0.5 origin-top ${tw.primary.bg}`}
        style={{ transform: `translate(-50%, 0) rotate(${value + 180}deg)` }}
      />
      <div
        className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${tw.primary.bg}`}
      />
    </div>
  )
}
