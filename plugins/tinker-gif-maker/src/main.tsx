import { useCallback, useEffect, useState, type DragEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import { LoadingCircle } from 'share/components/Loading'
import { ToasterProvider } from 'share/components/Toaster'
import { droppedFilePath } from 'share/lib/util'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Toolbar from './components/Toolbar'
import FramePreview from './components/FramePreview'
import FrameList from './components/FrameList'
import NewSizeDialog from './components/NewSizeDialog'
import DelayDialog from './components/DelayDialog'
import { DEFAULT_DELAY_MS } from './lib/gif'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const [newDialogOpen, setNewDialogOpen] = useState(false)

  const handleNew = useCallback(() => {
    setNewDialogOpen(true)
  }, [])

  const handleNewConfirm = useCallback((width: number, height: number) => {
    store.newProject(width, height)
  }, [])

  const handleOpen = useCallback(async () => {
    const result = await tinker.showOpenDialog({
      title: t('openGif'),
      properties: ['openFile'],
      filters: [{ name: 'GIF', extensions: ['gif'] }],
    })
    if (result.canceled || !result.filePaths[0]) return
    try {
      await store.openPath(result.filePaths[0])
    } catch {
      toast.error(t('openFailed'))
    }
  }, [t])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (!file) return
      if (!endWith(lowerCase(file.name), '.gif')) {
        toast.error(t('openFailed'))
        return
      }
      try {
        await store.openFromFile(file, droppedFilePath(file))
      } catch {
        toast.error(t('openFailed'))
      }
    },
    [t]
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const mod = e.metaKey || e.ctrlKey
      if (mod && e.code === 'KeyO') {
        e.preventDefault()
        void handleOpen()
        return
      }
      if (mod && e.code === 'KeyN') {
        e.preventDefault()
        handleNew()
        return
      }
      if (mod && e.code === 'KeyS') {
        e.preventDefault()
        if (store.hasProject && !store.exporting) void store.exportGif()
        return
      }

      if (!store.hasProject) return

      if (e.code === 'Space') {
        e.preventDefault()
        store.togglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        store.stopPlayback()
        store.selectPrev()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        store.stopPlayback()
        store.selectNext()
      } else if (e.code === 'Home') {
        e.preventDefault()
        store.stopPlayback()
        store.selectFirst()
      } else if (e.code === 'End') {
        e.preventDefault()
        store.stopPlayback()
        store.selectLast()
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault()
        store.deleteSelectedFrame()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleNew, handleOpen])

  return (
    <ToasterProvider>
      <div
        className={`relative h-screen flex flex-col ${tw.bg.primary}`}
        onDragOver={handleDragOver}
        onDrop={(e) => void handleDrop(e)}
      >
        <Toolbar onNew={handleNew} onOpen={() => void handleOpen()} />
        <FramePreview />
        <FrameList />
        {store.loading && (
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center ${tw.bg.primary}/80`}
          >
            <LoadingCircle />
          </div>
        )}
        <NewSizeDialog
          open={newDialogOpen}
          onClose={() => setNewDialogOpen(false)}
          onConfirm={handleNewConfirm}
          defaultWidth={store.width || undefined}
          defaultHeight={store.height || undefined}
        />
        <DelayDialog
          open={store.delayDialogOpen}
          delay={store.currentFrame?.delay ?? DEFAULT_DELAY_MS}
          onClose={() => store.closeDelayDialog()}
          onConfirm={(delay, applyToAll) =>
            store.setFrameDelay(delay, applyToAll)
          }
        />
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
