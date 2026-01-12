import { observer } from 'mobx-react-lite'
import {
  Clipboard,
  Eraser,
  Undo,
  Redo,
  FolderOpen,
  FilePlus,
  Save,
  Columns2,
  FileEdit,
  Eye,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import CopyButton from 'share/components/CopyButton'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton onClick={() => store.newFile()} title={t('newFile')}>
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={() => store.openFile()} title={t('openFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.saveFile()}
        disabled={store.isEmpty || !store.hasUnsavedChanges}
        title={t('save')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
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

      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'split'}
        onClick={() => store.setViewMode('split')}
        title={t('splitView')}
      >
        <Columns2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'editor'}
        onClick={() => store.setViewMode('editor')}
        title={t('editorOnly')}
      >
        <FileEdit size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'preview'}
        onClick={() => store.setViewMode('preview')}
        title={t('previewOnly')}
      >
        <Eye size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <CopyButton
        variant="toolbar"
        text={store.markdownInput}
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
        onClick={() => store.clearMarkdown()}
        disabled={store.isEmpty}
        title={t('clear')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      {store.lineCount > 0 && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-1 whitespace-nowrap">
          {t('lines', { count: store.lineCount })}
        </div>
      )}
    </Toolbar>
  )
})
