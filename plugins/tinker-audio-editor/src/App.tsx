import { useRef, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import AudioEditor, { AudioEditorHandle } from './components/AudioEditor'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import {
  trimBuffer,
  deleteSelection,
  silenceSelection,
  reverseBuffer,
  normalizeBuffer,
  fadeIn,
  fadeOut,
  applyGain,
  pasteIntoBuffer,
  encodeWav,
} from './lib/audioUtils'

export default observer(function App() {
  const { t } = useTranslation()
  const editorRef = useRef<AudioEditorHandle>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  function getAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  const handleOpen = useCallback(async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Audio',
          extensions: [
            'mp3',
            'wav',
            'ogg',
            'flac',
            'm4a',
            'aac',
            'opus',
            'webm',
          ],
        },
      ],
    })
    if (result.canceled || !result.filePaths.length) return

    const filePath = result.filePaths[0]
    const fileName = filePath.split('/').pop() ?? filePath

    store.setLoading(true)
    try {
      const res = await fetch(`file://${filePath}`)
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer)
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
      store.setAudio(blob, audioBuffer, fileName)
    } catch {
      // ignore decode errors
    } finally {
      store.setLoading(false)
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!store.audioBuffer) return
    const result = await tinker.showSaveDialog({
      defaultPath: store.fileName.replace(/\.[^.]+$/, '') + '_edited.wav',
      filters: [{ name: 'WAV Audio', extensions: ['wav'] }],
    })
    if (result.canceled || !result.filePath) return

    const blob = encodeWav(store.audioBuffer)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filePath.split('/').pop() ?? 'export.wav'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handlePlayPause = useCallback(() => {
    store.setPlaying(!store.isPlaying)
  }, [])

  const handleStop = useCallback(() => {
    store.setPlaying(false)
    store.setCurrentTime(0)
    editorRef.current?.seekTo(0)
  }, [])

  const handleTrim = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = trimBuffer(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setBuffer(buf, t('trim'))
  }, [t])

  const handleDelete = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = deleteSelection(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setBuffer(buf, t('delete'))
  }, [t])

  const handleSilence = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = silenceSelection(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setBuffer(buf, t('silence'))
  }, [t])

  const handleCopy = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = trimBuffer(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setClipboard(buf)
  }, [])

  const handlePaste = useCallback(() => {
    if (!store.audioBuffer || !store.clipboardBuffer) return
    const offset = editorRef.current?.getCurrentTime() ?? store.currentTime
    const buf = pasteIntoBuffer(
      store.audioBuffer,
      store.clipboardBuffer,
      offset
    )
    store.setBuffer(buf, t('paste'))
  }, [t])

  const handleFadeIn = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = fadeIn(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setBuffer(buf, t('fadeIn'))
  }, [t])

  const handleFadeOut = useCallback(() => {
    if (!store.audioBuffer || !store.hasSelection) return
    const buf = fadeOut(
      store.audioBuffer,
      store.selectionStart!,
      store.selectionEnd!
    )
    store.setBuffer(buf, t('fadeOut'))
  }, [t])

  const handleReverse = useCallback(() => {
    if (!store.audioBuffer) return
    const buf = store.hasSelection
      ? reverseBuffer(
          store.audioBuffer,
          store.selectionStart!,
          store.selectionEnd!
        )
      : reverseBuffer(store.audioBuffer)
    store.setBuffer(buf, t('reverse'))
  }, [t])

  const handleNormalize = useCallback(() => {
    if (!store.audioBuffer) return
    const buf = normalizeBuffer(store.audioBuffer)
    store.setBuffer(buf, t('normalize'))
  }, [t])

  const handleGain = useCallback(async () => {
    if (!store.audioBuffer) return
    const input = prompt(t('gainPrompt'), '1.5')
    if (input === null) return
    const factor = parseFloat(input)
    if (isNaN(factor) || factor <= 0) return
    const buf = applyGain(store.audioBuffer, factor)
    store.setBuffer(buf, t('gain'))
  }, [t])

  const handleUndo = useCallback(() => store.undo(), [])
  const handleRedo = useCallback(() => store.redo(), [])

  const handleZoomIn = useCallback(() => {
    store.setZoom(Math.min(store.zoom * 2, 200))
  }, [])
  const handleZoomOut = useCallback(() => {
    store.setZoom(Math.max(store.zoom / 2, 1))
  }, [])
  const handleZoomReset = useCallback(() => store.setZoom(1), [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const mod = e.metaKey || e.ctrlKey
      if (e.code === 'Space') {
        e.preventDefault()
        handlePlayPause()
      } else if (mod && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if (
        mod &&
        (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))
      ) {
        e.preventDefault()
        handleRedo()
      } else if (mod && e.code === 'KeyC') {
        handleCopy()
      } else if (mod && e.code === 'KeyV') {
        handlePaste()
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (store.hasSelection) handleDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlePlayPause, handleUndo, handleRedo, handleCopy, handlePaste, handleDelete])

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
      >
        <Toolbar
          onOpen={handleOpen}
          onExport={handleExport}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onTrim={handleTrim}
          onDelete={handleDelete}
          onSilence={handleSilence}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onFadeIn={handleFadeIn}
          onFadeOut={handleFadeOut}
          onReverse={handleReverse}
          onNormalize={handleNormalize}
          onGain={handleGain}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />
        <AudioEditor ref={editorRef} />
        <StatusBar />
      </div>
    </ToasterProvider>
  )
})
