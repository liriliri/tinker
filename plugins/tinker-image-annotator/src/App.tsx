import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import ImageOpen from 'share/components/ImageOpen'
import { ToasterProvider } from 'share/components/Toaster'
import { openImageFile } from 'share/lib/util'
import { tw } from 'share/theme'
import Canvas from './components/Canvas'
import SideToolbar from './components/SideToolbar'
import TopToolbar from './components/TopToolbar'
import ZoomControls from './components/ZoomControls'
import store from './store'

export default observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA')
      const isEditingText =
        !!store.app?.editor?.innerEditor?.editTarget || isEditableTarget

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        store.saveToFile()
        return
      }

      if (event.metaKey || event.ctrlKey) {
        const key = event.key.toLowerCase()
        if (key === 'z' && !isEditingText) {
          event.preventDefault()
          if (event.shiftKey) {
            store.redo()
          } else {
            store.undo()
          }
          return
        }
        if (key === 'y' && !isEditingText) {
          event.preventDefault()
          store.redo()
          return
        }
      }

      if (event.key === 'Escape') {
        store.setTool('select')
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (isEditingText) return
        store.deleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.both.primary}`}>
        <TopToolbar />

        <div className="flex flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            <SideToolbar />
            <div className={'flex-1 relative'}>
              <Canvas />
              {store.hasImage && <ZoomControls />}
              {!store.hasImage && (
                <div className="absolute inset-0 p-4 flex">
                  <div className="flex-1 [&>div]:m-0 [&>div]:h-full">
                    <ImageOpen
                      onOpenImage={async () => {
                        const result = await openImageFile({ title: t('open') })
                        if (result) {
                          store.loadImage(result.file)
                        }
                      }}
                      openTitle={t('title')}
                      supportedFormats={t('subtitle')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToasterProvider>
  )
})
