import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Search,
  AlignJustify,
  FileText,
  Image,
  File,
  ListX,
} from 'lucide-react'
import store, { FilterTab } from '../store'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
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
      {/* Tab Navigation */}
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

      {/* Search Bar */}
      <div className="relative w-48">
        <Search
          size={14}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.both.tertiary}`}
        />
        <input
          type="text"
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          placeholder={t('search')}
          className={`w-full pl-7 pr-2 py-1 text-xs border rounded ${tw.border.both} ${tw.bg.both.input} ${tw.text.both.primary} focus:outline-none ${tw.primary.focusBorder} placeholder:${tw.text.light.tertiary} dark:placeholder:${tw.text.dark.tertiary}`}
        />
      </div>

      <ToolbarSpacer />

      {/* Item Count */}
      {store.items.length > 0 && (
        <span className={`text-xs ${tw.text.both.tertiary} mr-2`}>
          {t('itemCount', { count: store.filteredItems.length })}
        </span>
      )}

      {/* Clear All Button */}
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
