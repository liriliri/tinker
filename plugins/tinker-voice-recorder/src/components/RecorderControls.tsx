import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Pause, Play, Save, RotateCcw } from 'lucide-react'
import dateFormat from 'licia/dateFormat'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import { mediaDurationFormat } from 'share/lib/util'
import store from '../store'
import AudioRecorder from '../lib/AudioRecorder'
import WaveformVisualizer from './WaveformVisualizer'
import AudioWaveform from './AudioWaveform'
import WaveformLoading from './WaveformLoading'

const RecorderControls = observer(() => {
  const { t } = useTranslation()
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const handleStartRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder()
      await audioRecorderRef.current.start(() => {
        store.setMicrophoneBlocked(true)
        toast.error(t('microphoneAccessDenied'))
      })
      const analyserNode = audioRecorderRef.current.getAnalyser()
      setAnalyser(analyserNode)
      store.startRecording()
    } catch {
      store.setMicrophoneBlocked(true)
      toast.error(t('pleaseAllowMicrophone'))
    }
  }

  const handleStopRecording = async () => {
    if (audioRecorderRef.current) {
      try {
        const blob = await audioRecorderRef.current.stop()
        store.stopRecording(blob)
        setAnalyser(null)
        audioRecorderRef.current = null
      } catch {
        toast.error(t('failedToStopRecording'))
      }
    }
  }

  const handlePauseRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.pause()
      store.pauseRecording()
    }
  }

  const handleResumeRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.resume()
      store.resumeRecording()
    }
  }

  const handlePlayPause = () => {
    store.setPlaying(!store.isPlaying)
  }

  const handleDownload = async () => {
    if (!store.recordedBlob) return

    try {
      const result = await tinker.showSaveDialog({
        defaultPath: `recording-${dateFormat('yyyymmddHH')}.mp3`,
        filters: [{ name: 'MP3', extensions: ['mp3'] }],
      })

      if (result.canceled) return

      const tmpDir = tinker.tmpdir()
      const tempInput = `${tmpDir}/tinker-voice-${Date.now()}.webm`
      const buffer = await store.recordedBlob.arrayBuffer()
      await tinker.writeFile(tempInput, new Uint8Array(buffer))

      tinker.runFFmpeg([
        '-i',
        tempInput,
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '128k',
        result.filePath,
      ])

      toast.success(t('savedSuccessfully'))
    } catch (error) {
      console.error('Failed to save recording:', error)
      toast.error(t('failedToSaveRecording'))
    }
  }

  const handleReset = () => {
    store.reset()
  }

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center px-6 ${tw.bg.secondary}`}
    >
      {/* Timer Display */}
      <div
        className={`text-5xl font-mono tabular-nums text-center w-[240px] ${tw.text.primary} mb-14`}
      >
        {mediaDurationFormat(store.currentRecordingDuration)}
      </div>

      {/* Play Time Display - always occupy space */}
      <div
        className={`text-2xl font-mono tabular-nums text-center w-[240px] ${tw.text.secondary} -mt-8 mb-10`}
      >
        {store.isPreview
          ? mediaDurationFormat(store.currentPlayTime)
          : '\u00A0'}
      </div>

      {/* Waveform Display Area */}
      <div className="w-full px-6 h-[120px] mb-10 flex items-center justify-center">
        {/* Wait Record State - Show record button */}
        {store.isWaitingToRecord && (
          <div className="flex flex-col items-center gap-8">
            <button
              onClick={handleStartRecording}
              className={`flex items-center justify-center w-24 h-24 rounded-full ${tw.primary.bg} ${tw.primary.bgHover} text-white transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl`}
            >
              <Mic size={40} />
            </button>
            <p className={`text-sm ${tw.text.secondary}`}>
              {t('clickToStartRecording')}
            </p>
          </div>
        )}

        {/* Recording/Paused State - Show waveform */}
        {(store.isRecording || store.isPaused) && (
          <WaveformVisualizer
            analyser={analyser}
            isRecording={store.isRecording}
            isPaused={store.isPaused}
          />
        )}

        {/* Processing State - Show loading */}
        {store.isProcessing && <WaveformLoading />}

        {/* Preview State - Show audio waveform */}
        {store.isPreview && (
          <AudioWaveform
            audioBlob={store.recordedBlob}
            isPlaying={store.isPlaying}
            onPlayPause={handlePlayPause}
          />
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-6 min-h-[120px]">
        {/* Active Recording State */}
        {store.isRecording && (
          <div className="flex items-center gap-6">
            <button
              onClick={handlePauseRecording}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${tw.bg.tertiary} ${tw.text.primary} hover:opacity-80 transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              <Pause size={20} />
            </button>
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              <Square size={20} />
            </button>
          </div>
        )}

        {/* Paused State */}
        {store.isPaused && (
          <div className="flex items-center gap-6">
            <button
              onClick={handleResumeRecording}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${tw.primary.bg} ${tw.primary.bgHover} text-white transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              <Play size={20} />
            </button>
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              <Square size={20} />
            </button>
          </div>
        )}

        {/* Preview State */}
        {store.isPreview && (
          <div className="flex items-center gap-6">
            <button
              onClick={handlePlayPause}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${tw.primary.bg} ${tw.primary.bgHover} text-white transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              {store.isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={handleDownload}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${tw.bg.tertiary} ${tw.text.primary} hover:opacity-80 transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              <Save size={20} />
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${tw.bg.tertiary} ${tw.text.primary} hover:opacity-80 transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              <RotateCcw size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default RecorderControls
