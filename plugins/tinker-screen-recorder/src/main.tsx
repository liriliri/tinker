import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import toast from 'react-hot-toast'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import ScreenRecorder from './lib/ScreenRecorder'
import SourceToolbar from './components/SourceToolbar'
import SourcePicker from './components/SourcePicker'
import VideoPreview from './components/VideoPreview'
import RecorderBar from './components/RecorderBar'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const recorderRef = useRef<ScreenRecorder | null>(null)
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    void store.loadSources()
    return () => {
      void recorderRef.current?.stop().catch(() => {})
      void tinker.setBackgroundThrottling(true)
    }
  }, [])

  const handleStart = async () => {
    if (!store.selectedId) return
    try {
      const recorder = new ScreenRecorder()
      await recorder.start(store.selectedId)
      recorderRef.current = recorder
      setLiveStream(recorder.getStream())
      await tinker.setBackgroundThrottling(false)
      store.startRecording()
    } catch (err) {
      console.error(err)
      toast.error(t('failedToStart'))
    }
  }

  const handleStop = async () => {
    if (!recorderRef.current) return
    try {
      const blob = await recorderRef.current.stop()
      recorderRef.current = null
      setLiveStream(null)
      await tinker.setBackgroundThrottling(true)
      store.stopRecording(blob)
    } catch {
      toast.error(t('failedToStop'))
    }
  }

  const handlePause = () => {
    recorderRef.current?.pause()
    store.pauseRecording()
  }

  const handleResume = () => {
    recorderRef.current?.resume()
    store.resumeRecording()
  }

  const handleSave = async () => {
    if (!store.recordedBlob) return
    try {
      const result = await tinker.showSaveDialog({
        defaultPath: `recording-${dateFormat('yyyymmddHHMM')}.webm`,
        filters: [{ name: 'WebM', extensions: ['webm'] }],
      })
      if (result.canceled || !result.filePath) return
      const buffer = await store.recordedBlob.arrayBuffer()
      await tinker.writeFile(result.filePath, new Uint8Array(buffer))
      toast.success(t('savedSuccessfully'))
    } catch (err) {
      console.error(err)
      toast.error(t('failedToSave'))
    }
  }

  const handleReset = () => {
    store.reset()
  }

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.secondary}`}>
        <SourceToolbar />
        <div className="flex-1 flex min-h-0">
          <SourcePicker
            className={`w-72 shrink-0 border-r ${tw.border} ${tw.bg.primary}`}
          />
          <VideoPreview stream={liveStream} className="flex-1" />
        </div>
        <RecorderBar
          onStart={() => void handleStart()}
          onStop={() => void handleStop()}
          onPause={handlePause}
          onResume={handleResume}
          onSave={() => void handleSave()}
          onReset={handleReset}
          canStart={store.canRecord}
          isRecording={store.isRecording}
          isPaused={store.isPaused}
          isPreview={store.isPreview}
          duration={store.currentRecordingDuration}
        />
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
