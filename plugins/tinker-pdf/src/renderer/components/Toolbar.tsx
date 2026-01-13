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
} from 'lucide-react'
import store from '../store'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      {/* Left side */}
      <div className="flex items-center gap-0">
        <ToolbarButton
          variant="toggle"
          active={store.sidebarOpen && !!store.pdfDoc}
          onClick={() => store.toggleSidebar()}
          title={t('toggleSidebar')}
          disabled={!store.pdfDoc}
        >
          <PanelLeft size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => store.openFile()} title={t('openFile')}>
          <FolderOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>

      {store.pdfDoc && (
        <>
          {/* Spacer to push controls to center */}
          <div className="flex-1" />

          {/* Center controls */}
          <div className="flex items-center gap-2">
            {/* Page navigation group - compact */}
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                onClick={() => store.prevPage()}
                disabled={store.currentPage <= 1}
                title={t('previousPage')}
              >
                <ChevronLeft size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>

              <span
                className={`text-xs ${tw.text.both.primary} min-w-[80px] text-center px-2`}
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

            {/* Zoom controls group - compact */}
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                onClick={() => store.zoomOut()}
                disabled={store.scale <= 0.5}
                title={t('zoomOut')}
              >
                <ZoomOut size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>

              <span
                className={`text-xs ${tw.text.both.primary} min-w-[40px] text-center px-1`}
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

          {/* Spacer to balance the layout */}
          <div className="flex-1" />

          {/* Right side - placeholder to match left side width */}
          <div className="flex items-center gap-0 invisible">
            <ToolbarButton disabled>
              <PanelLeft size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton disabled>
              <FolderOpen size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </div>
        </>
      )}
    </Toolbar>
  )
})
