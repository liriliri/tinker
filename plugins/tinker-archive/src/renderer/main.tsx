import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import FileOpen from 'share/components/FileOpen'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import store from './store'
import Toolbar from './components/Toolbar'
import ArchivePane from './components/ArchivePane'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <ConfirmProvider>
      <PromptProvider>
        <ToasterProvider>
          <div
            className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
          >
            <Toolbar />
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {store.loading && !store.isOpen ? (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingCircle />
                </div>
              ) : store.isOpen ? (
                <ArchivePane />
              ) : (
                <FileOpen
                  onOpenFile={(file) => store.openArchiveFromFile(file)}
                  openTitle={t('openTitle')}
                  accept=".zip"
                />
              )}
            </div>
          </div>
        </ToasterProvider>
      </PromptProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
