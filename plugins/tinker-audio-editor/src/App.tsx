import { useRef, useEffect, useCallback, useState } from 'react'
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
import NormalizeDialog from './components/NormalizeDialog'
import GainDialog from './components/GainDialog'
import SpeedDialog from './components/SpeedDialog'
import InsertSilenceDialog from './components/InsertSilenceDialog'
import {
  loadAudioFile,
  trimBuffer,
  deleteBuffer,
  silenceBuffer,
  gainBuffer,
  normalizeBuffer,
  speedBuffer,
  copyBuffer,
  pasteBuffer,
  fadeInBuffer,
  fadeOutBuffer,
  insertSilenceBuffer,
  exportAudio,
  SUPPORTED_EXTENSIONS,
} from './lib/audioUtils'

export default observer(function App() {
  const { t } = useTranslation()
  const editorRef = useRef<AudioEditorHandle>(null)
  const [normalizeOpen, setNormalizeOpen] = useState(false)
  const [gainOpen, setGainOpen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [insertSilenceOpen, setInsertSilenceOpen] = useState(false)

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
          name: 'Audio/Video',
          extensions: SUPPORTED_EXTENSIONS,
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
      defaultPath: store.fileName.replace(/\.[^.]+$/, '') + '.wav',
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

  const handleCut = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    store.setClipboardBuffer(
      copyBuffer(store.audioBuffer, store.selectionStart!, store.selectionEnd!)
    )
    applyOp(t('cut'), () =>
      deleteBuffer(
        store.audioBuffer!,
        store.selectionStart!,
        store.selectionEnd!
      )
    )
  }, [t, applyOp])

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
    setNormalizeOpen(true)
  }, [])

  const handleNormalizeConfirm = useCallback(
    (maxVal: number, equally: boolean) => {
      setNormalizeOpen(false)
      if (!store.hasSelection || !store.audioBuffer) return
      applyOp(t('normalize'), () =>
        normalizeBuffer(
          store.audioBuffer!,
          store.selectionStart!,
          store.selectionEnd!,
          maxVal,
          equally
        )
      )
    },
    [t, applyOp]
  )

  const handleNormalizeCancel = useCallback(() => {
    setNormalizeOpen(false)
  }, [])

  const handleGain = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    setGainOpen(true)
  }, [])

  const handleGainConfirm = useCallback(
    (factor: number) => {
      setGainOpen(false)
      if (!store.hasSelection || !store.audioBuffer) return
      applyOp(t('gain'), () =>
        gainBuffer(
          store.audioBuffer!,
          store.selectionStart!,
          store.selectionEnd!,
          factor
        )
      )
    },
    [t, applyOp]
  )

  const handleGainCancel = useCallback(() => {
    setGainOpen(false)
  }, [])

  const handleSpeed = useCallback(() => {
    if (!store.hasSelection || !store.audioBuffer) return
    setSpeedOpen(true)
  }, [])

  const handleSpeedConfirm = useCallback(
    (rate: number) => {
      setSpeedOpen(false)
      if (!store.hasSelection || !store.audioBuffer) return
      applyOp(t('speed'), () =>
        speedBuffer(
          store.audioBuffer!,
          store.selectionStart!,
          store.selectionEnd!,
          rate
        )
      )
    },
    [t, applyOp]
  )

  const handleSpeedCancel = useCallback(() => {
    setSpeedOpen(false)
  }, [])

  const handleInsertSilence = useCallback(() => {
    if (!store.audioBuffer) return
    setInsertSilenceOpen(true)
  }, [])

  const handleInsertSilenceConfirm = useCallback(
    (duration: number) => {
      setInsertSilenceOpen(false)
      if (!store.audioBuffer) return
      const offset = editorRef.current?.getCurrentTime() ?? store.currentTime
      applyOp(t('insertSilence'), () =>
        insertSilenceBuffer(store.audioBuffer!, offset, duration)
      )
    },
    [t, applyOp]
  )

  const handleInsertSilenceCancel = useCallback(() => {
    setInsertSilenceOpen(false)
  }, [])

  const handleUndo = useCallback(() => store.undo(), [])
  const handleRedo = useCallback(() => store.redo(), [])

  const handleSeekLeft = useCallback(() => editorRef.current?.seekLeft(), [])
  const handleSeekRight = useCallback(() => editorRef.current?.seekRight(), [])
  const handleSeekStart = useCallback(() => editorRef.current?.seekStart(), [])
  const handleSeekEnd = useCallback(() => editorRef.current?.seekEnd(), [])

  const handleSelectAll = useCallback(() => {
    if (!store.audioBuffer) return
    editorRef.current?.selectAll()
  }, [])

  const handleClearSelection = useCallback(() => {
    editorRef.current?.clearSelection()
  }, [])

  const handleSelectionContextMenu = useCallback(
    (x: number, y: number) => {
      const hasSelection = store.hasSelection
      tinker.showContextMenu(x, y, [
        ...(hasSelection
          ? [
              { label: t('trim'), click: handleTrim },
              { label: t('delete'), click: handleDelete },
              { label: t('silence'), click: handleSilence },
              { label: t('gain'), click: handleGain },
              { label: t('normalize'), click: handleNormalize },
              { label: t('speed'), click: handleSpeed },
              { type: 'separator' as const },
            ]
          : []),
        { label: t('copy'), enabled: hasSelection, click: handleCopy },
        { label: t('cut'), enabled: hasSelection, click: handleCut },
        {
          label: t('paste'),
          enabled: !!store.clipboardBuffer,
          click: handlePaste,
        },
        { type: 'separator' as const },
        { label: t('insertSilence'), click: handleInsertSilence },
        ...(hasSelection
          ? [
              { type: 'separator' as const },
              { label: t('fadeIn'), click: handleFadeIn },
              { label: t('fadeOut'), click: handleFadeOut },
            ]
          : []),
        { type: 'separator' as const },
        { label: t('selectAll'), click: handleSelectAll },
        ...(hasSelection
          ? [{ label: t('clearSelection'), click: handleClearSelection }]
          : []),
      ])
    },
    [
      t,
      handleTrim,
      handleDelete,
      handleSilence,
      handleGain,
      handleNormalize,
      handleSpeed,
      handleCopy,
      handleCut,
      handlePaste,
      handleFadeIn,
      handleFadeOut,
      handleInsertSilence,
      handleSelectAll,
      handleClearSelection,
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
      } else if (mod && e.code === 'KeyA') {
        e.preventDefault()
        handleSelectAll()
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (store.hasSelection) handleDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlePlayPause, handleUndo, handleRedo, handleCopy, handlePaste, handleSelectAll, handleDelete])

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
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSeekLeft={handleSeekLeft}
          onSeekRight={handleSeekRight}
          onSeekStart={handleSeekStart}
          onSeekEnd={handleSeekEnd}
          onHeightIncrease={handleHeightIncrease}
          onHeightDecrease={handleHeightDecrease}
        />
        <AudioEditor
          ref={editorRef}
          onOpenFile={handleOpenFile}
          onSelectionContextMenu={handleSelectionContextMenu}
        />
        <StatusBar />
        <NormalizeDialog
          open={normalizeOpen}
          onConfirm={handleNormalizeConfirm}
          onCancel={handleNormalizeCancel}
        />
        <GainDialog
          open={gainOpen}
          onConfirm={handleGainConfirm}
          onCancel={handleGainCancel}
        />
        <SpeedDialog
          open={speedOpen}
          onConfirm={handleSpeedConfirm}
          onCancel={handleSpeedCancel}
        />
        <InsertSilenceDialog
          open={insertSilenceOpen}
          onConfirm={handleInsertSilenceConfirm}
          onCancel={handleInsertSilenceCancel}
        />
      </div>
    </ToasterProvider>
  )
})
