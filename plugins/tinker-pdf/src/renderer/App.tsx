import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import PdfViewer from './components/PdfViewer'
import ThumbnailSidebar from './components/ThumbnailSidebar'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <AlertProvider locale={i18n.language}>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.primary}`}
      >
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <ThumbnailSidebar />
          <PdfViewer />
        </div>
      </div>
    </AlertProvider>
  )
})
