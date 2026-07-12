import { useEffect, useRef } from 'react'
import { tw } from 'share/theme'
import { getPaletteHexColors } from '../lib/pixelate'
import { PIXEL_PALETTE_OPTIONS, type PixelPaletteId } from '../types'

export interface PalettePickerProps {
  value: PixelPaletteId
  onChange: (value: PixelPaletteId) => void
  labels: Record<PixelPaletteId, string>
}

interface PaletteSwatchProps {
  id: PixelPaletteId
  label: string
  selected: boolean
  onSelect: (id: PixelPaletteId) => void
}

interface PaletteStripProps {
  colors: string[]
}

const MAX_SWATCH_COLORS = 5

function PaletteStrip({ colors }: PaletteStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const visibleColors =
      colors.length <= MAX_SWATCH_COLORS
        ? colors
        : colors.slice(0, MAX_SWATCH_COLORS)

    const draw = () => {
      const cssW = container.clientWidth
      const cssH = container.clientHeight
      if (cssW <= 0 || cssH <= 0) return

      const dpr = window.devicePixelRatio || 1
      const pixelW = Math.max(1, Math.round(cssW * dpr))
      const pixelH = Math.max(1, Math.round(cssH * dpr))
      canvas.width = pixelW
      canvas.height = pixelH
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw in device pixels so top/bottom edges stay flush.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      let x = 0
      for (let i = 0; i < visibleColors.length; i++) {
        const nextX = Math.round(((i + 1) * pixelW) / visibleColors.length)
        ctx.fillStyle = visibleColors[i]
        ctx.fillRect(x, 0, Math.max(1, nextX - x), pixelH)
        x = nextX
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [colors])

  return (
    <div ref={containerRef} className="h-5 w-full shrink-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

function PaletteSwatch({ id, label, selected, onSelect }: PaletteSwatchProps) {
  const colors = getPaletteHexColors(id)

  return (
    <button
      type="button"
      title={label}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
      className={`flex h-full w-full min-w-0 flex-col items-center gap-0.5 rounded border box-border p-1 text-center transition-colors ${
        selected
          ? tw.primary.border
          : `${tw.gray.border600} ${tw.hover} ${tw.primary.hoverBorder}`
      }`}
    >
      <PaletteStrip colors={colors} />
      <span
        className={`w-full truncate text-center text-[10px] leading-tight ${tw.text.secondary}`}
      >
        {label}
      </span>
    </button>
  )
}

export default function PalettePicker({
  value,
  onChange,
  labels,
}: PalettePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PIXEL_PALETTE_OPTIONS.map((option) => (
        <PaletteSwatch
          key={option.value}
          id={option.value}
          label={labels[option.value]}
          selected={value === option.value}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}
