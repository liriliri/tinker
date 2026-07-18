import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import FileOpen from 'share/components/FileOpen'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import FileList from './components/FileList'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  const handleFileOpen = async (file: File) => {
    if (store.shredding) return

    const filePath = tinker.getPathForFile(file)
    if (filePath) {
      await store.addFilePaths([filePath])
    }
  }

  return (
    <ConfirmProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
        >
          <Toolbar />

          {!store.hasFiles ? (
            <FileOpen
              onOpenFile={handleFileOpen}
              openTitle={t('openFiles')}
              supportedFormats={t('dropFilesHere')}
            />
          ) : (
            <FileList />
          )}
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
