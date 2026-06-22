import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import ScanDirsModal from 'share/components/ScanDirsModal'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import PhotoToolbar from './components/Toolbar'
import PhotoGallery from './components/PhotoGallery'
import PhotoViewer from './components/PhotoViewer'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <PromptProvider>
          <div
            className={`relative flex h-screen flex-col overflow-hidden ${tw.bg.primary}`}
          >
            <PhotoToolbar />

            <div className="flex-1 overflow-hidden">
              <PhotoGallery />
            </div>

            <PhotoViewer />
            <ScanDirsModal
              open={store.showScanDialog}
              isDark={store.isDark}
              isScanning={store.isScanning}
              scanDirs={store.scanDirs}
              scanDirChecked={store.scanDirChecked}
              title={t('scanLocalPhotos')}
              onClose={() => store.hideScanDialog()}
              onAddDir={(dir) => store.addScanDir(dir)}
              onRemoveDir={(dir) => store.removeScanDir(dir)}
              onToggleChecked={(dir) => store.toggleScanDirChecked(dir)}
              onScan={(dirs) => store.scanLocalPhotos(dirs)}
            />
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
