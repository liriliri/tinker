import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import store from './store'
import Toolbar from './components/Toolbar'
import HexEditorView from './components/HexEditorView'
import FileOpen from './components/FileOpen'
import { tw } from 'share/theme'

export default observer(function App() {
  const { t } = useTranslation()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]

    try {
      const filePath = (file as any).path
      if (filePath) {
        const buffer = await hexEditor.readFile(filePath)
        store.importData(Array.from(buffer))
      }
    } catch (err) {
      console.error('Failed to load file:', err)
    }
  }

  return (
    <AlertProvider>
      <div
        className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toolbar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {!store.hasData ? (
            <FileOpen
              onOpenFile={() => store.openFileDialog()}
              openTitle={t('openTitle')}
              supportedFormats={t('supportedFormats')}
            />
          ) : (
            <HexEditorView />
          )}
        </div>
      </div>
    </AlertProvider>
  )
})
