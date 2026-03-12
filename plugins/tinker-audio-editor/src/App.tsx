import { useRef, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import clamp from 'licia/clamp'
import splitPath from 'licia/splitPath'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import AudioEditor, { AudioEditorHandle } from './components/AudioEditor'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import {
  loadAudioFile,
  trimBuffer,
  deleteBuffer,
  silenceBuffer,
  gainBuffer,
  normalizeBuffer,
  copyBuffer,
  pasteBuffer,
  fadeInBuffer,
  fadeOutBuffer,
  exportAudio,
} from './lib/audioUtils'

export default observer(function App() {
  const { t } = useTranslation()
  const editorRef = useRef<AudioEditorHandle>(null)

  const applyOp = useCallback((label: string, op: () => AudioBuffer) => {
    store.pushUndo(label)
    try {
      store.applyAudioBuffer(op())
    } catch {
      store.undo()
    }
  }, [])

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
    const fileName = splitPath(filePath).name || filePath
    store.setLoading(true)
    try {
      const audioBuffer = await loadAudioFile(filePath)
      store.setAudio(audioBuffer, fileName)
    } catch {
      // ignore errors
    } finally {
      store.setLoading(false)
    }
  }, [])

  const handleOpenFile = useCallback(async (file: File) => {
    store.setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const tmpDir = await tinker.getPath('temp')
      const ext = splitPath(file.name).ext.slice(1) || 'wav'
      const tempInput = `${tmpDir}/tinker-audio-in-${Date.now()}.${ext}`
      await tinker.writeFile(tempInput, new Uint8Array(arrayBuffer))
      const audioBuffer = await loadAudioFile(tempInput)
      store.setAudio(audioBuffer, file.name)
    } catch {
      // ignore errors
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
    await exportAudio(store.audioBuffer, result.filePath)
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
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('trim'), () =>
      trimBuffer(store.audioBuffer!, store.selectionStart!, store.selectionEnd!)
    )
  }, [t, applyOp])

  const handleDelete = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('delete'), () =>
      deleteBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

  const handleSilence = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('silence'), () =>
      silenceBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

  const handleCopy = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    store.setClipboardBuffer(
      copyBuffer(store.audioBuffer, store.selectionStart!, store.selectionEnd!)
    )
  }, [])

  const handlePaste = useCallback(() => {
    if (!store.clipboardBuffer || !store.audioBuffer) return
    const offset = editorRef.current?.getCurrentTime() ?? store.currentTime
    applyOp(t('paste'), () =>
      pasteBuffer(store.audioBuffer!, store.clipboardBuffer!, offset)
    )
  }, [t, applyOp])

  const handleFadeIn = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('fadeIn'), () =>
      fadeInBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

  const handleFadeOut = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('fadeOut'), () =>
      fadeOutBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

  const handleNormalize = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    applyOp(t('normalize'), () =>
      normalizeBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

  const handleGain = useCallback(() => {
    if (!store.hasAudio || !store.audioBuffer) return
    const input = prompt(t('gainPrompt'), '1.5')
    if (input === null) return
    const factor = parseFloat(input)
    if (isNaN(factor) || factor <= 0) return
    applyOp(t('gain'), () => gainBuffer(store.audioBuffer!, factor))
  }, [t, applyOp])

  const handleUndo = useCallback(() => store.undo(), [])
  const handleRedo = useCallback(() => store.redo(), [])

  const handleSelectionContextMenu = useCallback(
    (x: number, y: number) => {
      tinker.showContextMenu(x, y, [
        { label: t('trim'), click: handleTrim },
        { label: t('delete'), click: handleDelete },
        { label: t('silence'), click: handleSilence },
        { label: t('normalize'), click: handleNormalize },
        { type: 'separator' },
        { label: t('copy'), click: handleCopy },
        {
          label: t('paste'),
          enabled: !!store.clipboardBuffer,
          click: handlePaste,
        },
        { type: 'separator' },
        { label: t('fadeIn'), click: handleFadeIn },
        { label: t('fadeOut'), click: handleFadeOut },
      ])
    },
    [
      t,
      handleTrim,
      handleDelete,
      handleSilence,
      handleNormalize,
      handleCopy,
      handlePaste,
      handleFadeIn,
      handleFadeOut,
    ]
  )

  const handleHeightIncrease = useCallback(() => {
    store.setBarHeight(clamp(store.barHeight + 0.1, 0.1, 1))
  }, [])
  const handleHeightDecrease = useCallback(() => {
    store.setBarHeight(clamp(store.barHeight - 0.1, 0.1, 1))
  }, [])

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
          onGain={handleGain}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onHeightIncrease={handleHeightIncrease}
          onHeightDecrease={handleHeightDecrease}
        />
        <AudioEditor
          ref={editorRef}
          onOpenFile={handleOpenFile}
          onSelectionContextMenu={handleSelectionContextMenu}
        />
        <StatusBar />
      </div>
    </ToasterProvider>
  )
})
