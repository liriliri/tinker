import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import SharePdfViewer from 'share/components/PdfViewer'
import FileOpen from 'share/components/FileOpen'
import store from '../store'

export default observer(function PdfViewer() {
  const { t } = useTranslation()

  return (
    <SharePdfViewer
      className="flex-1"
      pdfDoc={store.pdfDoc}
      loading={store.isLoading}
      empty={
        <FileOpen
          onOpenFile={(file) => store.openFileFromFile(file)}
          openTitle={t('openTitle')}
          accept=".pdf"
          fileName={store.fileName}
        />
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
  )
})
