import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import ImageOpen from 'share/components/ImageOpen'
import { tw } from 'share/theme'
import Canvas from './components/Canvas'
import SideToolbar from './components/SideToolbar'
import TopToolbar from './components/TopToolbar'
import store from './store'

export default observer(function App() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenImage = async () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      store.loadImage(file)
    }
    event.target.value = ''
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        store.saveToFile()
        return
      }

      if (event.key === 'Escape') {
        store.setTool('select')
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        store.deleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`h-screen flex flex-col ${tw.bg.both.primary}`}>
      <TopToolbar onOpenImage={handleOpenImage} />

      <div className="flex flex-1 min-h-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-1 min-h-0">
          <SideToolbar />
          <div className={'flex-1 relative'}>
            <Canvas />
            {!store.hasImage && (
              <div className="absolute inset-0 p-4 flex">
                <div className="flex-1 [&>div]:m-0 [&>div]:h-full">
                  <ImageOpen
                    onOpenImage={handleOpenImage}
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
  )
})
