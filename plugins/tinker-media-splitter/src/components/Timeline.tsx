import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import fileUrl from 'licia/fileUrl'
import WaveSurfer from 'wavesurfer.js'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import { formatTimecode, segmentColorClass } from '../lib/util'
import { isSegmentFinished } from '../lib/segments'
import { fitWaveSurferWidth, prepareWaveformFile } from '../lib/waveform'

const WAVE_HEIGHT = 40

function waveColor(isDark: boolean) {
  return isDark ? THEME_COLORS.gray.dark[400] : THEME_COLORS.gray.light[500]
}

export default observer(function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const duration = store.duration
  const busy = store.isExporting
  const media = store.media
  const isDark = store.isDark

  useEffect(() => {
    const container = waveRef.current
    if (!container || !media || media.hasVideo || !media.hasAudio) {
      wsRef.current?.destroy()
      wsRef.current = null
      return
    }

    let cancelled = false
    let tempPath: string | null = null
    let ro: ResizeObserver | null = null

    const color = waveColor(isDark)
    const ws = WaveSurfer.create({
      container,
      waveColor: color,
      progressColor: color,
      cursorWidth: 0,
      height: WAVE_HEIGHT,
      interact: false,
      hideScrollbar: true,
      normalize: true,
    })
    wsRef.current = ws
    ;(async () => {
      try {
        tempPath = await prepareWaveformFile(media.filePath)
        if (cancelled) return
        await ws.load(fileUrl(tempPath))
        if (cancelled) return
        const mediaEl = ws.getMediaElement()
        if (mediaEl) {
          mediaEl.muted = true
          mediaEl.volume = 0
        }
        fitWaveSurferWidth(ws)
        ro = new ResizeObserver(() => fitWaveSurferWidth(ws))
        ro.observe(container)
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load waveform:', err)
        }
      }
    })()

    return () => {
      cancelled = true
      ro?.disconnect()
      ws.destroy()
      if (wsRef.current === ws) wsRef.current = null
      if (tempPath) {
        void tinker.rm(tempPath).catch(() => undefined)
      }
    }
  }, [media?.filePath, media?.hasVideo, media?.hasAudio])

  useEffect(() => {
    const ws = wsRef.current
    if (!ws) return
    const color = waveColor(isDark)
    ws.setOptions({ waveColor: color, progressColor: color })
  }, [isDark])

  const timeToRatio = (time: number) => {
    if (duration <= 0) return 0
    return Math.min(1, Math.max(0, time / duration))
  }

  const clientXToTime = (clientX: number) => {
    const el = trackRef.current
    if (!el || duration <= 0) return 0
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * duration
  }

  const scrubTo = (clientX: number) => {
    store.requestSeek(clientXToTime(clientX))
  }

  const startScrub = (e: React.MouseEvent) => {
    if (busy) return
    e.preventDefault()
    scrubTo(e.clientX)
    const onMove = (ev: MouseEvent) => scrubTo(ev.clientX)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleSegmentMouseDown = (
    e: React.MouseEvent,
    id: string,
    edge: 'start' | 'end' | 'body'
  ) => {
    e.stopPropagation()
    if (busy || !store.media) return
    store.setActiveSegment(id)
    const seg = store.segments.find((item) => item.id === id)
    if (!seg) return

    if (edge === 'body') {
      startScrub(e)
      return
    }

    const onMove = (ev: MouseEvent) => {
      const time = clientXToTime(ev.clientX)
      if (edge === 'start') {
        store.updateSegmentRange(id, time, seg.end)
      } else {
        store.updateSegmentRange(id, seg.start, time)
      }
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className={`shrink-0 px-3 pt-3 pb-3 border-t ${tw.border} ${tw.bg.secondary}`}
    >
      <div
        ref={trackRef}
        className={`relative h-10 rounded cursor-pointer overflow-visible ${tw.bg.tertiary}`}
        onMouseDown={startScrub}
      >
        {media && !media.hasVideo && media.hasAudio && (
          <div
            ref={waveRef}
            className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden rounded"
          />
        )}

        {store.segments.map((seg, index) => {
          if (!isSegmentFinished(seg)) return null
          const left = timeToRatio(seg.start) * 100
          const width = timeToRatio(seg.end - seg.start) * 100
          const active = store.activeSegmentId === seg.id
          const opacity = active ? 'opacity-90' : 'opacity-70'
          return (
            <div
              key={seg.id}
              className={`absolute top-1 bottom-0.5 z-[1] box-border hover:opacity-90 ${segmentColorClass(
                index
              )} ${opacity} ${
                active
                  ? 'border border-white/80 dark:border-white/70'
                  : 'border border-transparent'
              }`}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.2)}%` }}
              title={`${formatTimecode(seg.start)} – ${formatTimecode(
                seg.end
              )}`}
              onMouseDown={(e) => handleSegmentMouseDown(e, seg.id, 'body')}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize"
                onMouseDown={(e) => handleSegmentMouseDown(e, seg.id, 'start')}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize"
                onMouseDown={(e) => handleSegmentMouseDown(e, seg.id, 'end')}
              />
            </div>
          )
        })}

        <div
          className="absolute top-0 bottom-0 z-10 w-px -translate-x-1/2 pointer-events-none bg-gray-700 dark:bg-gray-200"
          style={{ left: `${timeToRatio(store.currentTime) * 100}%` }}
        />

        <div
          className="absolute top-0 bottom-0 z-20 w-3 -translate-x-1/2 cursor-ew-resize"
          style={{ left: `${timeToRatio(store.commandedTime) * 100}%` }}
          onMouseDown={(e) => {
            e.stopPropagation()
            startScrub(e)
          }}
        >
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-800 dark:border-t-gray-100" />
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[6px] bottom-[6px] w-px bg-gray-800 dark:bg-gray-100" />
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-800 dark:border-b-gray-100" />
        </div>
      </div>
    </div>
  )
})
