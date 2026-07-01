import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import ScanDirsModal from 'share/components/ScanDirsModal'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import ReaderToolbar from './components/Toolbar'
import BookGallery from './components/BookGallery'
import PdfReader from './components/PdfReader'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <div
          className={`relative flex h-screen flex-col overflow-hidden ${tw.bg.primary}`}
        >
          <ReaderToolbar />

          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            {store.readerOpen && store.currentBook ? (
              <PdfReader />
            ) : (
              <BookGallery />
            )}
          </div>

          <ScanDirsModal
            open={store.showScanDialog}
            isDark={store.isDark}
            isScanning={store.isScanning}
            scanDirs={store.scanDirs}
            scanDirChecked={store.scanDirChecked}
            title={t('scanLocalBooks')}
            onClose={() => store.hideScanDialog()}
            onAddDir={(dir) => store.addScanDir(dir)}
            onRemoveDir={(dir) => store.removeScanDir(dir)}
            onToggleChecked={(dir) => store.toggleScanDirChecked(dir)}
            onScan={(dirs) => store.scanLocalBooks(dirs)}
          />
        </div>
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
