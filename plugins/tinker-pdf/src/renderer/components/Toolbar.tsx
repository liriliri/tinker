import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import store from '../store'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { pdfjsLib } from '../lib/pdfjs'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleOpenFile = async () => {
    try {
      const result = await tinker.showOpenDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        properties: ['openFile'],
      })

      if (result.canceled || !result.filePaths.length) return

      const filePath = result.filePaths[0]
      store.setLoading(true)
      store.setFileName(filePath.split('/').pop() || '')

      // Read file using pdf API
      const fileData = await pdf.readFile(filePath)

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: fileData })
      const pdfDoc = await loadingTask.promise

      store.setPdfDoc(pdfDoc)
    } catch (error) {
      console.error('Error loading PDF:', error)
      store.showError('Failed to load PDF file')
    } finally {
      store.setLoading(false)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpenFile} title={t('openFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.prevPage()}
        disabled={store.currentPage <= 1 || !store.pdfDoc}
        title={t('previousPage')}
      >
        <ChevronLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <span
        className={`text-xs ${tw.text.light.primary} ${tw.text.dark.primary} min-w-[60px] text-center`}
      >
        {store.pdfDoc ? `${store.currentPage} / ${store.numPages}` : '-'}
      </span>

      <ToolbarButton
        onClick={() => store.nextPage()}
        disabled={store.currentPage >= store.numPages || !store.pdfDoc}
        title={t('nextPage')}
      >
        <ChevronRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.zoomOut()}
        disabled={store.scale <= 0.5 || !store.pdfDoc}
        title={t('zoomOut')}
      >
        <ZoomOut size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <span
        className={`text-xs ${tw.text.light.primary} ${tw.text.dark.primary} min-w-[50px] text-center`}
      >
        {store.pdfDoc ? `${Math.round(store.scale * 100)}%` : '-'}
      </span>

      <ToolbarButton
        onClick={() => store.zoomIn()}
        disabled={store.scale >= 3 || !store.pdfDoc}
        title={t('zoomIn')}
      >
        <ZoomIn size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.resetZoom()}
        disabled={!store.pdfDoc}
        title={t('resetZoom')}
      >
        <RotateCcw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {store.fileName && (
        <>
          <ToolbarSpacer />
          <span
            className={`text-xs ${tw.text.light.secondary} ${tw.text.dark.secondary} truncate max-w-xs`}
          >
            {store.fileName}
          </span>
        </>
      )}
    </Toolbar>
  )
})
