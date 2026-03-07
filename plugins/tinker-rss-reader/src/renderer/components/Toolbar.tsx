import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, PanelLeft, PanelLeftClose, List, LayoutGrid } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import type { Filter } from '../types'

interface ToolbarProps {
  onAddSource: () => void
}

const FILTER_IDS: Filter[] = ['all', 'unread']

export default observer(function ToolbarComponent({
  onAddSource,
}: ToolbarProps) {
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
      <ToolbarButton title={t('addFeed')} onClick={onAddSource}>
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarSearch
        value={store.searchQuery}
        onChange={(v) => store.setSearchQuery(v)}
        placeholder={t('search')}
      />
      <ToolbarSpacer />
      {FILTER_IDS.map((id) => (
        <ToolbarButton
          key={id}
          variant="toggle"
          active={store.filter === id}
          onClick={() => store.setFilter(id)}
          className="px-2 py-1 text-xs"
        >
          {t(id)}
        </ToolbarButton>
      ))}
      <ToolbarSeparator />
      <ToolbarButtonGroup>
        <ToolbarButton
          variant="toggle"
          active={store.viewMode === 'list'}
          onClick={() => store.setViewMode('list')}
          title={t('listView')}
          className={`rounded-none rounded-l border-r ${tw.border}`}
        >
          <List size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          variant="toggle"
          active={store.viewMode === 'card'}
          onClick={() => store.setViewMode('card')}
          title={t('cardView')}
          className="rounded-none rounded-r"
        >
          <LayoutGrid size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>
    </Toolbar>
  )
})
