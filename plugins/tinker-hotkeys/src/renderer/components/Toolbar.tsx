import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlignJustify,
  Terminal,
  Monitor,
  Folder,
  Globe,
  Package,
  Plus,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import type { FilterTab } from '../types'
import store from '../store'

const tabs: { id: FilterTab; icon: typeof AlignJustify; label: string }[] = [
  { id: 'all', icon: AlignJustify, label: 'all' },
  { id: 'command', icon: Terminal, label: 'command' },
  { id: 'plugin', icon: Package, label: 'plugin' },
  { id: 'app', icon: Monitor, label: 'application' },
  { id: 'directory', icon: Folder, label: 'directory' },
  { id: 'url', icon: Globe, label: 'url' },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const addMenu = useMemo(
    () => [
      {
        label: t('addPlugin'),
        click: () => store.openAddDialog('plugin'),
      },
      {
        label: t('addApp'),
        click: () => store.openAddDialog('app'),
      },
      {
        label: t('addDirectory'),
        click: () => store.openAddDialog('directory'),
      },
      {
        label: t('addUrl'),
        click: () => store.openAddDialog('url'),
      },
    ],
    [t]
  )

  return (
    <Toolbar>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = store.filterTab === tab.id
        return (
          <ToolbarButton
            key={tab.id}
            variant="toggle"
            active={isActive}
            onClick={() => store.setFilterTab(tab.id)}
            className="px-2 py-1 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Icon size={TOOLBAR_ICON_SIZE} />
              {t(tab.label)}
            </div>
          </ToolbarButton>
        )
      })}

      <ToolbarSeparator />

      <ToolbarSearch
        value={store.searchQuery}
        onChange={(v) => store.setSearchQuery(v)}
        placeholder={t('search')}
        className="-ml-2"
      />
      <ToolbarSpacer />
      <ToolbarButton
        onClick={() => store.openAddDialog('command')}
        menu={addMenu}
        title={t('add')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
