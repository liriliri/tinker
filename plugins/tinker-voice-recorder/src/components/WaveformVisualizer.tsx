import { useEffect, useRef } from 'react'
import { tw, THEME_COLORS } from 'share/theme'

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null
  isRecording: boolean
  isPaused: boolean
}

const WaveformVisualizer = ({
  analyser,
  isRecording,
  isPaused,
}: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Only clear canvas when not recording at all (not when paused)
      if (canvasRef.current && !isPaused) {
        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        if (canvasCtx) {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // If paused, stop animation but keep the last frame
    if (isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    const getCanvasDimensions = () => ({
      width: canvas.width,
      height: canvas.height,
    })

    // Smoothing parameters
    const downsampleFactor = 8
    const smoothingWindow = 3

    const smoothData = (data: Uint8Array) => {
      const smoothed = new Float32Array(data.length)
      for (let i = 0; i < data.length; i++) {
        let sum = 0
        let count = 0
        for (
          let j = Math.max(0, i - smoothingWindow);
          j <= Math.min(data.length - 1, i + smoothingWindow);
          j++
        ) {
          sum += data[j]
          count++
        }
        smoothed[i] = sum / count
      }
      return smoothed
    }

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(dataArray)

      const smoothedData = smoothData(dataArray)

      const { width, height } = getCanvasDimensions()
      canvasCtx.clearRect(0, 0, width, height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = THEME_COLORS.primary
      canvasCtx.beginPath()

      const step = Math.floor(bufferLength / (width / downsampleFactor))
      const points: Array<{ x: number; y: number }> = []

      for (let i = 0; i < bufferLength; i += step) {
        const v = smoothedData[i] / 128.0
        const y = (v * height) / 2
        const x = (i / bufferLength) * width
        points.push({ x, y })
      }

      if (points.length > 0) {
        canvasCtx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2
          const yc = (points[i].y + points[i + 1].y) / 2
          canvasCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        }

        if (points.length > 1) {
          const lastPoint = points[points.length - 1]
          const secondLastPoint = points[points.length - 2]
          canvasCtx.quadraticCurveTo(
            secondLastPoint.x,
            secondLastPoint.y,
            lastPoint.x,
            lastPoint.y
          )
        }
      }

      canvasCtx.lineTo(width, height / 2)
      canvasCtx.stroke()
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isRecording, isPaused])

  return (
    <div
      className={`w-full rounded-lg overflow-hidden ${tw.bg.both.secondary}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-[120px]"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      />
    </div>
  )
}

export default WaveformVisualizer
