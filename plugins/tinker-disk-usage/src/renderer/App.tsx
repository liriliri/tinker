import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import FolderOpen from './components/FolderOpen'
import ScanningView from './components/ScanningView'
import ChartView from './components/ChartView'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <ConfirmProvider locale={i18n.language}>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
        >
          <Toolbar />

          {store.view === 'open' && <FolderOpen />}
          {store.view === 'scanning' && <ScanningView />}
          {store.view === 'chart' && <ChartView />}
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})
