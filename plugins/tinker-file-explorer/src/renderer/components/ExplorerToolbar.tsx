import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LayoutGrid,
  List,
  RotateCw,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import type Explorer from '../store/Explorer'
import store from '../store'
import PathBreadcrumb from './PathBreadcrumb'

interface ExplorerToolbarProps {
  tab: Explorer
}

export default observer(function ExplorerToolbar({
  tab,
}: ExplorerToolbarProps) {
  const { t } = useTranslation()
  const [editingPath, setEditingPath] = useState(false)

  return (
    <Toolbar>
      <ToolbarButton
        title={t('goBack')}
        disabled={!tab.canGoBack}
        onClick={() => void store.goBack(tab.id)}
      >
        <ArrowLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('goForward')}
        disabled={!tab.canGoForward}
        onClick={() => void store.goForward(tab.id)}
      >
        <ArrowRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('goUp')}
        disabled={!tab.canGoUp}
        onClick={() => void store.goUp(tab.id)}
      >
        <ArrowUp size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('refresh')}
        onClick={() => void store.refreshTab(tab.id)}
      >
        <RotateCw
          size={TOOLBAR_ICON_SIZE}
          className={tab.loading ? 'animate-spin' : ''}
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
                  .submitPathInput(tab.id)
                  .then(() => setEditingPath(false))
              }
              if (e.key === 'Escape') {
                store.setPathInput(tab.path)
                setEditingPath(false)
              }
            }}
            onBlur={() => {
              store.setPathInput(tab.path)
              setEditingPath(false)
            }}
            placeholder={t('pathPlaceholder')}
            className="w-full"
          />
        ) : (
          <PathBreadcrumb
            path={tab.path}
            places={store.places}
            onNavigate={(path) => void store.navigateTab(tab.id, path)}
            onEdit={() => {
              store.setPathInput(tab.path)
              setEditingPath(true)
            }}
          />
        )}
      </div>
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
    </Toolbar>
  )
})
