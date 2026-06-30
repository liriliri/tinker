import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  FolderSearch,
  ListX,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'
import store from '../store'

const PDF_EXTS = ['pdf']

const ReaderToolbar = observer(function ReaderToolbar() {
  const { t } = useTranslation()

  const handleImport = async () => {
    const result = await tinker.showOpenDialog({
      title: t('openBook'),
      filters: [{ name: t('bookFiles'), extensions: PDF_EXTS }],
      properties: ['openFile', 'multiSelections'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      await store.addFiles(result.filePaths)
    }
  }

  const handleClearList = async () => {
    if (store.books.length === 0) return
    const confirmed = await confirm({
      title: t('clearList'),
      message: t('clearListConfirm'),
    })
    if (!confirmed) return
    await store.clearAllBooks()
  }

  if (store.readerOpen) {
    return (
      <Toolbar className="relative">
        <ToolbarButton
          onClick={() => store.toggleSidebar()}
          title={t(store.sidebarOpen ? 'hideSidebar' : 'showSidebar')}
          disabled={!store.pdfDoc}
        >
          {store.sidebarOpen ? (
            <PanelLeftClose size={TOOLBAR_ICON_SIZE} />
          ) : (
            <PanelLeft size={TOOLBAR_ICON_SIZE} />
          )}
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => store.closeReader()}
          title={t('backToList')}
        >
          <ArrowLeft size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton onClick={handleImport} title={t('import')}>
          <FolderOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSpacer />

        {store.pdfDoc && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                onClick={() => store.prevPage()}
                disabled={store.currentPage <= 1}
                title={t('previousPage')}
              >
                <ChevronLeft size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>

              <span
                className={`text-xs ${tw.text.primary} min-w-[80px] text-center px-2`}
              >
                {`${store.currentPage} / ${store.numPages}`}
              </span>

              <ToolbarButton
                onClick={() => store.nextPage()}
                disabled={store.currentPage >= store.numPages}
                title={t('nextPage')}
              >
                <ChevronRight size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
            </div>

            <ToolbarSeparator />

            <div className="flex items-center gap-0.5">
              <ToolbarButton
                onClick={() => store.zoomOut()}
                disabled={store.scale <= 0.5}
                title={t('zoomOut')}
              >
                <ZoomOut size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>

              <span
                className={`text-xs ${tw.text.primary} min-w-[40px] text-center px-1`}
              >
                {`${Math.round(store.scale * 100)}%`}
              </span>

              <ToolbarButton
                onClick={() => store.zoomIn()}
                disabled={store.scale >= 3}
                title={t('zoomIn')}
              >
                <ZoomIn size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => store.resetZoom()}
                title={t('resetZoom')}
              >
                <RotateCcw size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
            </div>
          </div>
        )}
      </Toolbar>
    )
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleImport} title={t('import')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.showScanDialogView()}
        title={t('scanLocalBooks')}
      >
        <FolderSearch size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <span className="text-xs opacity-60 px-2">
        {t('bookCount', { count: store.books.length })}
      </span>

      <ToolbarButton
        onClick={handleClearList}
        disabled={store.books.length === 0 || store.isScanning}
        title={t('clearList')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})

export default ReaderToolbar
