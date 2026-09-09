import { useEffect, useRef, type CSSProperties } from 'react'
import { THEME_COLORS } from 'share/theme'
import { RING_ANIM_MS } from '../types'

const P = THEME_COLORS.primary
const PH = THEME_COLORS.primaryHover
const W = THEME_COLORS.bg.light.primary

const COLORS = [
  `color-mix(in srgb, ${P} 55%, ${W})`,
  P,
  `color-mix(in srgb, ${P} 75%, ${W})`,
  PH,
  `color-mix(in srgb, ${P} 65%, ${PH})`,
  `color-mix(in srgb, ${P} 70%, ${W})`,
]

const SHINE = `color-mix(in srgb, ${P} 40%, ${W})`

const FLOW_SPEED = 0.28

interface Blob {
  color: string
  radius: number
  angle: number
  speed: number
  orbit: number
  phase: number
}

interface FlowOrbProps {
  size: number
  className?: string
  style?: CSSProperties
  draggable?: boolean
  pressed?: boolean
}

export default function FlowOrb({
  size,
  className = '',
  style,
  draggable = false,
  pressed = false,
}: FlowOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size <= 0) return

    const view = canvas.ownerDocument.defaultView
    if (!view) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = view.devicePixelRatio || 1
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const blobs: Blob[] = COLORS.map((color, index) => ({
      color,
      radius: size * (0.35 + (index % 3) * 0.08),
      angle: (index / COLORS.length) * Math.PI * 2,
      speed: 0.35 + index * 0.12,
      orbit: size * (0.18 + (index % 2) * 0.1),
      phase: index * 1.3,
    }))

    let t = 0
    let raf = 0
    let last = view.performance.now()

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt * FLOW_SPEED

      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.fillStyle = COLORS[1]
      ctx.fillRect(0, 0, size, size)

      ctx.filter = `blur(${Math.max(4, size * 0.1)}px)`
      for (const blob of blobs) {
        const x =
          cx +
          Math.cos(t * blob.speed + blob.angle) * blob.orbit +
          Math.sin(t * 0.7 + blob.phase) * size * 0.08
        const y =
          cy +
          Math.sin(t * blob.speed + blob.angle) * blob.orbit +
          Math.cos(t * 0.9 + blob.phase) * size * 0.08

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius)
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(0.55, blob.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.filter = 'none'

      const hx = cx + Math.cos(t * 0.8) * size * 0.15
      const hy = cy + Math.sin(t * 0.8) * size * 0.15
      const shine = ctx.createRadialGradient(hx, hy, 0, hx, hy, size * 0.28)
      shine.addColorStop(0, SHINE)
      shine.addColorStop(1, 'transparent')
      ctx.fillStyle = shine
      ctx.fillRect(0, 0, size, size)

      ctx.restore()
      raf = view.requestAnimationFrame(draw)
    }

    raf = view.requestAnimationFrame(draw)
    return () => view.cancelAnimationFrame(raf)
  }, [size])

  return (
    <div
      className={`overflow-hidden rounded-full ${className}`}
      style={
        {
          width: size,
          height: size,
          WebkitAppRegion: draggable ? 'drag' : 'no-drag',
          transform: pressed ? 'scale(0.88)' : 'scale(1)',
          transition: `transform ${RING_ANIM_MS}ms ease`,
          ...style,
        } as CSSProperties
      }
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
