import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import HexEditor from 'share/components/HexEditor'
import FileOpen from 'share/components/FileOpen'
import { LoadingCircle } from 'share/components/Loading'
import store from './store'
import Toolbar from './components/Toolbar'
import { tw } from 'share/theme'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    try {
      await store.openFileFromFile(files[0])
    } catch (err) {
      console.error('Failed to load file:', err)
    }
  }

  const handleSetValue = useCallback((offset: number, value: number) => {
    store.setValue(offset, value)
  }, [])

  return (
    <AlertProvider locale={i18n.language}>
      <div
        className={`h-screen flex flex-col ${tw.bg.primary}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toolbar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {store.loading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingCircle />
            </div>
          ) : !store.hasData ? (
            <div className={'flex-1 flex flex-col'}>
              <FileOpen
                onOpenFile={(file) => store.openFileFromFile(file)}
                openTitle={t('openTitle')}
                supportedFormats=""
              />
            </div>
          ) : (
            <div className={'flex-1'}>
              <HexEditor
                data={store.data}
                nonce={store.nonce}
                isDark={store.isDark}
                onSetValue={handleSetValue}
              />
            </div>
          )}
        </div>
      </div>
    </AlertProvider>
  )
})
