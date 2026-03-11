import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import { Music } from 'lucide-react'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import { encodeWav } from '../lib/audioUtils'

export interface AudioEditorHandle {
  getCurrentTime: () => number
  seekTo: (time: number) => void
}

const AudioEditor = observer(
  forwardRef<AudioEditorHandle>(function AudioEditor(_props, ref) {
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WaveSurfer | null>(null)
    const regionsRef = useRef<RegionsPlugin | null>(null)
    const activeRegionRef = useRef<ReturnType<
      RegionsPlugin['addRegion']
    > | null>(null)
    const isDark = store.isDark

    const waveColor = isDark
      ? THEME_COLORS.gray.dark[300]
      : THEME_COLORS.gray.light[400]
    const progressColor = THEME_COLORS.primary
    const cursorColor = THEME_COLORS.primary

    // Initialize WaveSurfer once
    useEffect(() => {
      if (!containerRef.current) return

      const regions = RegionsPlugin.create()
      regionsRef.current = regions

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        cursorColor,
        cursorWidth: 2,
        height: 160,
        normalize: true,
        interact: true,
        plugins: [regions],
      })

      wsRef.current = ws

      ws.on('timeupdate', (time) => store.setCurrentTime(time))
      ws.on('finish', () => store.setPlaying(false))
      ws.on('play', () => store.setPlaying(true))
      ws.on('pause', () => store.setPlaying(false))

      regions.enableDragSelection({
        color: `${THEME_COLORS.primary}33`,
      })

      regions.on('region-created', (region) => {
        // Remove previous selection region
        if (activeRegionRef.current && activeRegionRef.current !== region) {
          activeRegionRef.current.remove()
        }
        activeRegionRef.current = region
        store.setSelection(region.start, region.end)
      })

      regions.on('region-updated', (region) => {
        store.setSelection(region.start, region.end)
      })

      return () => {
        ws.destroy()
        wsRef.current = null
        regionsRef.current = null
        activeRegionRef.current = null
      }
    }, [])

    // Update colors on theme change
    useEffect(() => {
      wsRef.current?.setOptions({ waveColor, progressColor, cursorColor })
    }, [isDark])

    // Reload waveform when audioBuffer changes
    useEffect(() => {
      if (!wsRef.current || !store.audioBuffer) return

      const blob = encodeWav(store.audioBuffer)
      const url = URL.createObjectURL(blob)
      const seekTime = store.currentTime

      wsRef.current.load(url).then(() => {
        URL.revokeObjectURL(url)
        if (seekTime > 0 && wsRef.current) {
          const dur = wsRef.current.getDuration()
          if (dur > 0) wsRef.current.seekTo(Math.min(seekTime / dur, 1))
        }
        // Clear any old regions
        regionsRef.current?.clearRegions()
        activeRegionRef.current = null
      })
    }, [store.audioBuffer])

    // Sync play/pause
    useEffect(() => {
      if (!wsRef.current) return
      if (store.isPlaying) {
        wsRef.current.play()
      } else {
        wsRef.current.pause()
      }
    }, [store.isPlaying])

    // Zoom
    useEffect(() => {
      wsRef.current?.zoom(store.zoom)
    }, [store.zoom])

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => wsRef.current?.getCurrentTime() ?? 0,
      seekTo: (time) => {
        const dur = wsRef.current?.getDuration() ?? 0
        if (dur > 0) wsRef.current?.seekTo(time / dur)
      },
    }))

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) store.setLoading(true)
    }, [])

    if (!store.hasAudio) {
      return (
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-3 ${tw.bg.secondary} rounded-lg mx-4 mb-4`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Music
            className={`w-12 h-12 ${tw.text.tertiary}`}
            strokeWidth={1.5}
          />
          <p className={`text-sm ${tw.text.secondary}`}>
            {store.isLoading ? t('loading') : t('noFile')}
          </p>
        </div>
      )
    }

    return (
      <div
        className={`flex-1 flex flex-col mx-4 mb-0 overflow-hidden rounded-lg ${tw.bg.secondary}`}
      >
        <div className="flex-1 px-3 py-3 overflow-x-auto">
          <div ref={containerRef} />
        </div>
      </div>
    )
  })
)

export default AudioEditor
