import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import toast from 'react-hot-toast'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import ScreenRecorder from './lib/ScreenRecorder'
import Toolbar from './components/Toolbar'
import SourcePicker from './components/SourcePicker'
import VideoPreview from './components/VideoPreview'
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
      flushSync(() => setLiveStream(null))
      recorderRef.current?.dispose()
      recorderRef.current = null
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
    const recorder = recorderRef.current
    if (!recorder) return

    const release = () => {
      flushSync(() => setLiveStream(null))
      recorder.dispose()
      recorderRef.current = null
    }

    try {
      const blob = await recorder.stop()
      release()
      await tinker.setBackgroundThrottling(true)
      store.stopRecording(blob)
    } catch {
      release()
      toast.error(t('failedToStop'))
    }
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
      store.reset()
    } catch (err) {
      console.error(err)
      toast.error(t('failedToSave'))
    }
  }

  const showPreview = store.isRecording || store.isPreview

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.secondary}`}>
        <Toolbar
          onStart={() => void handleStart()}
          onStop={() => void handleStop()}
          onSave={() => void handleSave()}
          onReset={() => store.reset()}
        />
        {showPreview ? (
          <VideoPreview
            stream={liveStream}
            className={`flex-1 min-h-0 ${tw.bg.primary}`}
          />
        ) : (
          <SourcePicker className={`flex-1 min-h-0 ${tw.bg.primary}`} />
        )}
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
