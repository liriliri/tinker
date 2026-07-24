import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import truncate from 'licia/truncate'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FilePlus,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  Plus,
  RotateCw,
} from 'lucide-react'
import {
  Toolbar as ToolbarComponent,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSearch,
  ToolbarSeparator,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import PathBar from 'share/components/PathBar'
import { tw } from 'share/theme'
import store from '../store'
import { promptCreateFolder } from '../lib/contextMenu'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const [editingPath, setEditingPath] = useState(false)

  const formatPathSegment = useCallback(
    (item: { name: string; path: string }) => truncate(item.name, 28),
    []
  )

  return (
    <ToolbarComponent>
      <ToolbarButton
        onClick={() => void store.createArchive()}
        title={t('newArchive')}
      >
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => void store.openArchive()}
        title={t('openArchive')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {store.isOpen && (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            title={t('goBack')}
            disabled={!store.canGoBack}
            onClick={() => void store.goBack()}
          >
            <ArrowLeft size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            title={t('goForward')}
            disabled={!store.canGoForward}
            onClick={() => void store.goForward()}
          >
            <ArrowRight size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            title={t('goUp')}
            disabled={!store.canGoUp}
            onClick={() => void store.goUp()}
          >
            <ArrowUp size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            title={t('refresh')}
            onClick={() => void store.refresh()}
          >
            <RotateCw
              size={TOOLBAR_ICON_SIZE}
              className={store.loading ? 'animate-spin' : ''}
            />
          </ToolbarButton>
          <div className="flex-1 min-w-0">
            {editingPath ? (
              <ToolbarTextInput
                autoFocus
                value={store.pathInput}
                onChange={(e) => store.setPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void store
                      .submitPathInput()
                      .then(() => setEditingPath(false))
                  }
                  if (e.key === 'Escape') {
                    store.setPathInput(store.currentPath)
                    setEditingPath(false)
                  }
                }}
                onBlur={() => {
                  store.setPathInput(store.currentPath)
                  setEditingPath(false)
                }}
                placeholder={t('pathPlaceholder')}
                className="w-full"
              />
            ) : (
              <PathBar
                path={store.currentPath}
                items={store.pathItems}
                formatSegment={formatPathSegment}
                onNavigate={(path) => void store.navigate(path)}
                onEdit={() => {
                  store.setPathInput(store.currentPath)
                  setEditingPath(true)
                }}
              />
            )}
          </div>
          <ToolbarSearch
            value={store.filterText}
            onChange={(value) => store.setFilterText(value)}
            placeholder={t('filterPlaceholder')}
            shortcut="f"
            className="!w-32 shrink-0"
          />
          <ToolbarButton
            title={t('addFiles')}
            onClick={() => void store.addFiles()}
          >
            <Plus size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            title={t('newFolder')}
            onClick={() =>
              void promptCreateFolder(t, (name) => store.createFolder(name))
            }
          >
            <FolderPlus size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButtonGroup>
            <ToolbarButton
              variant="toggle"
              active={store.viewMode === 'list'}
              onClick={() => store.setViewMode('list')}
              title={t('viewList')}
              className={`rounded-none rounded-l border-r ${tw.border}`}
            >
              <List size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarButton
              variant="toggle"
              active={store.viewMode === 'grid'}
              onClick={() => store.setViewMode('grid')}
              title={t('viewGrid')}
              className="rounded-none rounded-r"
            >
              <LayoutGrid size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </ToolbarButtonGroup>
        </>
      )}
    </ToolbarComponent>
  )
})
