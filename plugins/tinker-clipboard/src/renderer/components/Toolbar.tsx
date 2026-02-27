import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlignJustify, FileText, Image, File, ListX } from 'lucide-react'
import store from '../store'
import { FilterTab } from '../types'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'

const tabs: { id: FilterTab; icon: typeof AlignJustify; label: string }[] = [
  { id: 'all', icon: AlignJustify, label: 'all' },
  { id: 'text', icon: FileText, label: 'text' },
  { id: 'image', icon: Image, label: 'image' },
  { id: 'file', icon: File, label: 'file' },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleClearAll = async () => {
    const result = await confirm({
      title: t('clearAll'),
      message: t('confirmClearAll'),
    })
    if (result) {
      store.clearAll()
    }
  }

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
          >
            <div className="flex items-center gap-1.5">
              <Icon size={TOOLBAR_ICON_SIZE} />
              <span className="text-xs">{t(tab.label)}</span>
            </div>
          </ToolbarButton>
        )
      })}

      <ToolbarSeparator />

      <ToolbarSearch
        value={store.searchQuery}
        onChange={(value) => store.setSearchQuery(value)}
        placeholder={t('search')}
        className="-ml-2"
      />

      <ToolbarSpacer />

      {store.items.length > 0 && (
        <span className={`text-xs ${tw.text.tertiary} mr-2`}>
          {t('itemCount', { count: store.filteredItems.length })}
        </span>
      )}

      <ToolbarButton
        onClick={handleClearAll}
        disabled={store.items.length === 0}
        title={t('clearAll')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
