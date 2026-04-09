import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import FolderOpen from 'share/components/FolderOpen'
import store from './store'
import Toolbar from './components/Toolbar'
import ScanningView from './components/ScanningView'
import ResultView from './components/ResultView'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  return (
    <ConfirmProvider locale={i18n.language}>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
        >
          <Toolbar />

          {store.view === 'open' && (
            <FolderOpen
              onOpenFolder={(path) => store.openDirectory(path)}
              openTitle={t('openFolder')}
              dropTitle={t('dropFolderHere')}
            />
          )}
          {store.view === 'scanning' && <ScanningView />}
          {store.view === 'result' && <ResultView />}
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})
