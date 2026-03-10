import { observer } from 'mobx-react-lite'
import {
  Undo,
  Redo,
  Save,
  ZoomIn,
  ZoomOut,
  Search,
  PanelLeft,
  PanelLeftClose,
  Folder,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import CopyButton from 'share/components/CopyButton'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton
        title={t(store.sidebarOpen ? 'hideSidebar' : 'showSidebar')}
        onClick={() => store.toggleSidebar()}
      >
        {store.sidebarOpen ? (
          <PanelLeftClose size={TOOLBAR_ICON_SIZE} />
        ) : (
          <PanelLeft size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => tinker.showItemInPath(store.currentFilePath!)}
        disabled={!store.currentFilePath}
        title={t('showInFolder')}
      >
        <Folder size={TOOLBAR_ICON_SIZE} />
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

      <CopyButton
        variant="toolbar"
        text={store.content}
        disabled={store.isEmpty}
        title={t('copy')}
      />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.decreaseFontSize()}
        title={t('decreaseFontSize')}
      >
        <ZoomOut size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.increaseFontSize()}
        title={t('increaseFontSize')}
      >
        <ZoomIn size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton onClick={() => store.openSearch()} title={t('search')}>
        <Search size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <span className={`text-xs ${tw.text.secondary}`}>
        {t('cursor', { line: store.cursorLine, col: store.cursorColumn })}
      </span>
    </Toolbar>
  )
})
