import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
} from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import clamp from 'licia/clamp'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/plugins/timeline'
import { tw, THEME_COLORS } from 'share/theme'
import FileOpen from 'share/components/FileOpen'
import { LoadingCircle } from 'share/components/Loading'
import store from '../store'
import { SUPPORTED_ACCEPT } from '../lib/audioUtils'
import ChannelLabels from './ChannelLabels'
import { useWaveScrollbar, WaveScrollbarView } from './WaveScrollbar'
import VuMeter from './VuMeter'

export interface AudioEditorHandle {
  getCurrentTime: () => number
  seekTo: (time: number) => void
  seekLeft: () => void
  seekRight: () => void
  seekStart: () => void
  seekEnd: () => void
  clearSelection: () => void
  selectAll: () => void
}

interface AudioEditorProps {
  onOpenFile: (file: File) => Promise<void>
  onSelectionContextMenu: (x: number, y: number) => void
}

function seekBy(ws: WaveSurfer | null, direction: 1 | -1) {
  if (!ws) return
  const dur = ws.getDuration()
  if (!dur) return
  const step = Math.min(dur / 20, 5)
  const next = Math.max(
    0,
    Math.min(dur, ws.getCurrentTime() + direction * step)
  )
  ws.seekTo(next / dur)
}

const MIN_PX_PER_SEC = 10
const MAX_PX_PER_SEC = 5000
const ZOOM_FACTOR = 1.2
const TIMELINE_HEIGHT = 20

const AudioEditor = observer(
  forwardRef<AudioEditorHandle, AudioEditorProps>(function AudioEditor(
    { onOpenFile, onSelectionContextMenu },
    ref
  ) {
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WaveSurfer | null>(null)
    const regionsRef = useRef<RegionsPlugin | null>(null)
    const activeRegionRef = useRef<ReturnType<
      RegionsPlugin['addRegion']
    > | null>(null)
    const minPxPerSecRef = useRef(MIN_PX_PER_SEC)
    const savedViewRef = useRef<{
      pxPerSec: number
      scrollLeft: number
    } | null>(null)
    const isDark = store.isDark

    const audioCtxRef = useRef<AudioContext | null>(null)
    const leftGainRef = useRef<GainNode | null>(null)
    const rightGainRef = useRef<GainNode | null>(null)
    const [leftAnalyser, setLeftAnalyser] = useState<AnalyserNode | null>(null)
    const [rightAnalyser, setRightAnalyser] = useState<AnalyserNode | null>(
      null
    )

    const waveColor = isDark ? '#158044' : '#afebca'
    const progressColor = waveColor
    const cursorColor = THEME_COLORS.primary
    const mutedColor = isDark
      ? THEME_COLORS.gray.dark[300]
      : THEME_COLORS.gray.light[300]

    const getScrollContainer = useCallback(
      () => wsRef.current?.getWrapper().parentElement,
      []
    )
    const setScroll = useCallback(
      (px: number) => wsRef.current?.setScroll(px),
      []
    )

    const {
      scrollThumb,
      scrollbarRef,
      update: updateScrollThumb,
      onMouseDown: onScrollbarMouseDown,
    } = useWaveScrollbar({ getScrollContainer, setScroll })

    const initWaveSurfer = useCallback((container: HTMLDivElement) => {
      const regions = RegionsPlugin.create()
      regionsRef.current = regions

      const timelineTextColor = isDark
        ? THEME_COLORS.text.dark.secondary
        : THEME_COLORS.text.light.secondary
      const timeline = TimelinePlugin.create({
        height: TIMELINE_HEIGHT,
        insertPosition: 'beforebegin',
        style: { color: timelineTextColor },
      })

      const ws = WaveSurfer.create({
        container,
        waveColor,
        progressColor,
        cursorColor,
        cursorWidth: 2,
        height: 80,
        minPxPerSec: MIN_PX_PER_SEC,
        hideScrollbar: true,
        splitChannels: [
          { waveColor, progressColor, barHeight: store.barHeight },
          { waveColor, progressColor, barHeight: store.barHeight },
        ],
        interact: true,
        plugins: [regions, timeline],
      })

      wsRef.current = ws

      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const splitter = ctx.createChannelSplitter(2)
      const merger = ctx.createChannelMerger(2)
      const leftGain = ctx.createGain()
      const rightGain = ctx.createGain()
      leftGainRef.current = leftGain
      rightGainRef.current = rightGain
      const leftAn = ctx.createAnalyser()
      leftAn.fftSize = 2048
      const rightAn = ctx.createAnalyser()
      rightAn.fftSize = 2048

      const source = ctx.createMediaElementSource(ws.getMediaElement())
      source.connect(splitter)
      splitter.connect(leftGain, 0)
      splitter.connect(rightGain, 1)
      leftGain.connect(leftAn)
      rightGain.connect(rightAn)
      leftAn.connect(merger, 0, 0)
      rightAn.connect(merger, 0, 1)
      merger.connect(ctx.destination)

      setLeftAnalyser(leftAn)
      setRightAnalyser(rightAn)

      ws.on('timeupdate', (time) => store.setCurrentTime(time))
      ws.on('finish', () => store.setPlaying(false))
      ws.on('play', () => {
        ctx.resume()
        store.setPlaying(true)
      })
      ws.on('pause', () => store.setPlaying(false))
      ws.on('scroll', updateScrollThumb)
      ws.on('zoom', updateScrollThumb)
      ws.on('ready', () => {
        if (savedViewRef.current) {
          ws.zoom(savedViewRef.current.pxPerSec)
          const scrollContainer = ws.getWrapper().parentElement
          if (scrollContainer)
            scrollContainer.scrollLeft = savedViewRef.current.scrollLeft
          savedViewRef.current = null
        } else {
          const fitPx = ws.getWidth() / ws.getDuration()
          minPxPerSecRef.current = fitPx
          ws.zoom(fitPx)
        }
        updateScrollThumb()
      })

      regions.enableDragSelection({ color: 'rgba(59, 130, 246, 0.25)' })

      regions.on('region-initialized', (region) => {
        const leftHandle = region.element?.querySelector<HTMLElement>(
          '[part*="region-handle-left"]'
        )
        const rightHandle = region.element?.querySelector<HTMLElement>(
          '[part*="region-handle-right"]'
        )
        if (leftHandle) leftHandle.style.borderLeft = 'none'
        if (rightHandle) rightHandle.style.borderRight = 'none'
      })

      regions.on('region-created', (region) => {
        if (activeRegionRef.current && activeRegionRef.current !== region) {
          activeRegionRef.current.remove()
        }
        activeRegionRef.current = region
        store.setSelection(region.start, region.end)
        if (!store.isPlaying) ws.seekTo(region.start / ws.getDuration())
      })

      regions.on('region-updated', (region) => {
        store.setSelection(region.start, region.end)
        if (!store.isPlaying) ws.seekTo(region.start / ws.getDuration())
      })
    }, [])

    const waveContainerRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (node && !wsRef.current) {
          initWaveSurfer(node)
        }
        ;(
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node
      },
      [initWaveSurfer]
    )

    const roRef = useRef<ResizeObserver | null>(null)

    const wrapperRef = useCallback(
      (node: HTMLDivElement | null) => {
        roRef.current?.disconnect()
        roRef.current = null
        if (!node) return
        const ro = new ResizeObserver(() => {
          const h = Math.floor(node.clientHeight / 2)
          if (h > 0) wsRef.current?.setOptions({ height: h })
          updateScrollThumb()
        })
        ro.observe(node)
        roRef.current = ro
      },
      [updateScrollThumb]
    )

    useEffect(() => {
      return () => {
        roRef.current?.disconnect()
        roRef.current = null
        wsRef.current?.destroy()
        wsRef.current = null
        regionsRef.current = null
        activeRegionRef.current = null
        audioCtxRef.current?.close()
        audioCtxRef.current = null
        leftGainRef.current = null
        rightGainRef.current = null
      }
    }, [])

    // Update colors + channel options together to keep left/right consistent
    useEffect(() => {
      wsRef.current?.setOptions({
        waveColor,
        progressColor,
        cursorColor,
        splitChannels: [
          {
            waveColor: store.leftMuted ? mutedColor : waveColor,
            progressColor: store.leftMuted ? mutedColor : progressColor,
            barHeight: store.barHeight,
          },
          {
            waveColor: store.rightMuted ? mutedColor : waveColor,
            progressColor: store.rightMuted ? mutedColor : progressColor,
            barHeight: store.barHeight,
          },
        ],
      })
      const timelineTextColor = isDark
        ? THEME_COLORS.text.dark.secondary
        : THEME_COLORS.text.light.secondary
      const timelineWrapper = wsRef.current
        ?.getWrapper()
        .querySelector('[part="timeline-wrapper"]') as HTMLElement | null
      if (timelineWrapper) timelineWrapper.style.color = timelineTextColor
    }, [isDark, store.barHeight, store.leftMuted, store.rightMuted])

    useEffect(() => {
      if (!wsRef.current || !store.audioBlobUrl) return
      if (!store.isNewAudio) {
        savedViewRef.current = {
          pxPerSec: minPxPerSecRef.current,
          scrollLeft: wsRef.current.getWrapper().parentElement?.scrollLeft ?? 0,
        }
      }
      const selStart = store.selectionStart
      const selEnd = store.selectionEnd
      wsRef.current.load(store.audioBlobUrl).then(() => {
        regionsRef.current?.clearRegions()
        activeRegionRef.current = null
        if (!store.isNewAudio && selStart !== null && selEnd !== null) {
          const region = regionsRef.current?.addRegion({
            start: selStart,
            end: selEnd,
            color: 'rgba(59, 130, 246, 0.25)',
          })
          if (region) activeRegionRef.current = region
        }
      })
    }, [store.audioBlobUrl])

    useEffect(() => {
      if (!wsRef.current) return
      if (store.isPlaying) {
        wsRef.current.play()
      } else {
        wsRef.current.pause()
      }
    }, [store.isPlaying])

    useEffect(() => {
      if (leftGainRef.current)
        leftGainRef.current.gain.value = store.leftMuted ? 0 : 1
      if (rightGainRef.current)
        rightGainRef.current.gain.value = store.rightMuted ? 0 : 1
    }, [store.leftMuted, store.rightMuted])

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        const ws = wsRef.current
        if (!ws || !ws.getDuration()) return
        e.preventDefault()
        const scrollContainer = ws.getWrapper().parentElement
        if (!scrollContainer) return
        const fitPx = ws.getWidth() / ws.getDuration()
        const delta = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
        const next = clamp(
          minPxPerSecRef.current * delta,
          fitPx,
          MAX_PX_PER_SEC
        )
        const mouseX = e.clientX - scrollContainer.getBoundingClientRect().left
        const timeAtCursor =
          (scrollContainer.scrollLeft + mouseX) / minPxPerSecRef.current
        minPxPerSecRef.current = next
        ws.zoom(next)
        requestAnimationFrame(() => {
          scrollContainer.scrollLeft = Math.max(0, timeAtCursor * next - mouseX)
        })
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => el.removeEventListener('wheel', onWheel)
    }, [store.hasAudio])

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const onContextMenu = (e: MouseEvent) => {
        if (!store.hasAudio || store.isPlaying) return
        e.preventDefault()
        onSelectionContextMenu(e.clientX, e.clientY)
      }
      el.addEventListener('contextmenu', onContextMenu)
      return () => el.removeEventListener('contextmenu', onContextMenu)
    }, [
      store.hasAudio,
      store.isPlaying,
      store.hasSelection,
      onSelectionContextMenu,
    ])

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => wsRef.current?.getCurrentTime() ?? 0,
      seekTo: (time) => {
        const dur = wsRef.current?.getDuration() ?? 0
        if (dur > 0) wsRef.current?.seekTo(time / dur)
      },
      seekLeft: () => seekBy(wsRef.current, -1),
      seekRight: () => seekBy(wsRef.current, 1),
      seekStart: () => {
        const ws = wsRef.current
        if (!ws || !ws.getDuration()) return
        ws.seekTo(0)
      },
      seekEnd: () => {
        const ws = wsRef.current
        if (!ws || !ws.getDuration()) return
        ws.seekTo(1)
      },
      clearSelection: () => {
        regionsRef.current?.clearRegions()
        activeRegionRef.current = null
        store.clearSelection()
      },
      selectAll: () => {
        const dur = wsRef.current?.getDuration() ?? 0
        if (!dur) return
        regionsRef.current?.clearRegions()
        const region = regionsRef.current?.addRegion({
          start: 0,
          end: dur,
          color: 'rgba(59, 130, 246, 0.25)',
        })
        if (region) activeRegionRef.current = region
        store.setSelection(0, dur)
      },
    }))

    return !store.hasAudio ? (
      store.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingCircle />
        </div>
      ) : (
        <FileOpen
          onOpenFile={onOpenFile}
          openTitle={t('noFile')}
          accept={SUPPORTED_ACCEPT}
        />
      )
    ) : (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-row overflow-hidden">
          <ChannelLabels timelineHeight={TIMELINE_HEIGHT} />
          <div ref={wrapperRef} className="flex-1 overflow-hidden relative">
            <div ref={waveContainerRef} />
            <div
              className={`absolute left-0 right-0 border-t ${tw.border} pointer-events-none`}
              style={{ top: '50%' }}
            />
          </div>
        </div>
        <WaveScrollbarView
          scrollbarRef={scrollbarRef}
          scrollThumb={scrollThumb}
          onMouseDown={onScrollbarMouseDown}
        />
        <VuMeter leftAnalyser={leftAnalyser} rightAnalyser={rightAnalyser} />
      </div>
    )
  })
)

export default AudioEditor
