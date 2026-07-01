import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import PdfViewer from 'share/components/PdfViewer'
import { tw } from 'share/theme'
import store from '../store'
import Sidebar from './Sidebar'

const PdfReader = observer(function PdfReader() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      <Sidebar />
      <PdfViewer
        className="flex-1 min-h-0"
        pdfDoc={store.pdfDoc}
        loading={store.isLoading}
        empty={
          <div
            className={`flex h-full items-center justify-center ${tw.text.secondary}`}
          >
            {t('loading')}
          </div>
        }
        scale={store.scale}
        onScaleChange={(scale, isUserAction) =>
          store.setScale(scale, isUserAction)
        }
        userHasZoomed={store.userHasZoomed}
        onCurrentPageChange={(page) => store.setCurrentPage(page)}
        scrollToPage={store.scrollToPage}
        enableKeyboardShortcuts
        onPrevPage={() => store.prevPage()}
        onNextPage={() => store.nextPage()}
        onZoomIn={() => store.zoomIn()}
        onZoomOut={() => store.zoomOut()}
        onResetZoom={() => store.resetZoom()}
        onContainerWidthChange={(width) => store.setContainerWidth(width)}
      />
    </div>
  )
})

export default PdfReader
