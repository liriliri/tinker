import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Image,
} from 'lucide-react'
import store from '../store'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import ExportDialog from './ExportDialog'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  return (
    <>
      <Toolbar className="relative">
        {/* Left side */}
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

        <ToolbarButton onClick={() => store.openFile()} title={t('openFile')}>
          <FolderOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSpacer />

        {/* Right side - export button */}
        {store.pdfDoc && (
          <ToolbarButton
            onClick={() => setExportDialogOpen(true)}
            title={t('exportImages')}
            disabled={!!store.exportProgress}
          >
            <Image size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        )}

        {/* Center controls - absolute positioned */}
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

      <ExportDialog
        open={exportDialogOpen}
        exportProgress={store.exportProgress}
        onConfirm={(scale) => {
          store.exportImages(scale).then(() => setExportDialogOpen(false))
        }}
        onCancel={() => setExportDialogOpen(false)}
      />
    </>
  )
})
