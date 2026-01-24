import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'

const WAVEFORM_GRAY = '#8a8a8a'

interface AudioWaveformProps {
  audioBlob: Blob | null
  isPlaying: boolean
  onPlayPause: () => void
}

const AudioWaveform = ({
  audioBlob,
  isPlaying,
  onPlayPause,
}: AudioWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const onPlayPauseRef = useRef(onPlayPause)

  useEffect(() => {
    onPlayPauseRef.current = onPlayPause
  }, [onPlayPause])

  useEffect(() => {
    if (!containerRef.current || !audioBlob) return

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: WAVEFORM_GRAY,
      progressColor: THEME_COLORS.primary,
      cursorColor: THEME_COLORS.primary,
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 120,
      barGap: 2,
    })

    wavesurferRef.current = wavesurfer

    const url = URL.createObjectURL(audioBlob)
    wavesurfer.load(url)

    wavesurfer.on('timeupdate', (time) => {
      store.setCurrentPlayTime(time)
    })

    wavesurfer.on('audioprocess', (time) => {
      store.setCurrentPlayTime(time)
    })

    wavesurfer.on('finish', () => {
      onPlayPauseRef.current()
    })

    wavesurfer.on('interaction', () => {
      if (isPlaying) {
        wavesurfer.play()
      }
    })

    return () => {
      wavesurfer.destroy()
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (!wavesurferRef.current) return

    if (isPlaying) {
      wavesurferRef.current.play()
    } else {
      wavesurferRef.current.pause()
    }
  }, [isPlaying])

  return (
    <div
      className={`w-full rounded-lg overflow-hidden ${tw.bg.both.secondary} p-4`}
    >
      <div ref={containerRef} />
    </div>
  )
}

export default AudioWaveform
