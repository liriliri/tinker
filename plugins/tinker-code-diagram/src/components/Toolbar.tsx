import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import {
  Clipboard,
  Eraser,
  Undo,
  Redo,
  Columns2,
  FileEdit,
  Eye,
  FileDown,
  Image,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import isErr from 'licia/isErr'
import toStr from 'licia/toStr'
import upperCase from 'licia/upperCase'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarButtonGroup,
} from 'share/components/Toolbar'
import CopyButton from 'share/components/CopyButton'
import DarkModeSwitch from 'share/components/DarkModeSwitch'
import { alert } from 'share/components/Alert'
import store from '../store'
import {
  getDiagramBackground,
  getSvgElement,
  writeDiagramFile,
} from '../lib/mermaid'
import SampleDialog from './SampleDialog'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false)

  const runExport = async (format: 'svg' | 'png') => {
    const svg = getSvgElement(document.getElementById('diagram-preview'))
    if (!svg) {
      await alert({ title: t('exportFailed'), message: t('noDiagram') })
      return
    }

    try {
      const result = await tinker.showSaveDialog({
        defaultPath: `diagram.${format}`,
        filters: [
          { name: upperCase(format), extensions: [format] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (result.canceled || !result.filePath) return

      await writeDiagramFile(
        svg,
        format,
        result.filePath,
        getDiagramBackground(store.darkMode)
      )
    } catch (err) {
      await alert({
        title: t('exportFailed'),
        message: isErr(err) ? err.message : toStr(err),
      })
    }
  }

  return (
    <>
      <Toolbar>
        <ToolbarButton
          onClick={() => setSampleDialogOpen(true)}
          title={t('samples')}
        >
          <LayoutGrid size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => store.undo()}
          disabled={!store.canUndo}
          title={t('undo')}
        >
          <Undo size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => store.redo()}
          disabled={!store.canRedo}
          title={t('redo')}
        >
          <Redo size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <CopyButton
          variant="toolbar"
          text={store.codeInput}
          disabled={store.isEmpty}
          title={t('copy')}
        />

        <ToolbarButton
          onClick={() => store.pasteFromClipboard()}
          title={t('paste')}
        >
          <Clipboard size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => store.clearCode()}
          disabled={store.isEmpty}
          title={t('clear')}
        >
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => runExport('svg')}
          disabled={!store.hasRenderedDiagram || !!store.renderError}
          title={t('exportSvg')}
        >
          <FileDown size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => runExport('png')}
          disabled={!store.hasRenderedDiagram || !!store.renderError}
          title={t('exportPng')}
        >
          <Image size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <DarkModeSwitch
          dark={store.darkMode}
          onToggle={() => store.toggleDarkMode()}
          title={store.darkMode ? t('darkMode') : t('lightMode')}
          className="ml-2"
        />

        <ToolbarSpacer />

        <ToolbarButtonGroup>
          <ToolbarButton
            variant="toggle"
            active={store.viewMode === 'split'}
            onClick={() => store.setViewMode('split')}
            title={t('splitView')}
            className={`rounded-none rounded-l border-r ${tw.border}`}
          >
            <Columns2 size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton
            variant="toggle"
            active={store.viewMode === 'editor'}
            onClick={() => store.setViewMode('editor')}
            title={t('editorOnly')}
            className={`rounded-none border-r ${tw.border}`}
          >
            <FileEdit size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton
            variant="toggle"
            active={store.viewMode === 'preview'}
            onClick={() => store.setViewMode('preview')}
            title={t('previewOnly')}
            className="rounded-none rounded-r"
          >
            <Eye size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </ToolbarButtonGroup>

        {store.hasAI && (
          <ToolbarButton
            variant="toggle"
            active={store.chatOpen}
            onClick={() => store.toggleChat()}
            title={t('chatTitle')}
          >
            <MessageSquare size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        )}
      </Toolbar>

      <SampleDialog
        open={sampleDialogOpen}
        onClose={() => setSampleDialogOpen(false)}
      />
    </>
  )
})
