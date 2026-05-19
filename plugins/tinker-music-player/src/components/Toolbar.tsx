import { observer } from 'mobx-react-lite'
import { Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSearch,
  ToolbarSearchDropdownItem,
} from 'share/components/Toolbar'
import store from '../store'

const MusicToolbar = observer(() => {
  const { t } = useTranslation()

  const dropdownItems: ToolbarSearchDropdownItem[] =
    store.fileSearchResults.map((r) => ({
      id: r.path,
      label: r.name,
      description: r.path,
      icon: <Music size={12} />,
    }))

  const handleDropdownSelect = (item: ToolbarSearchDropdownItem) => {
    store.addFromSearchResult(item.id)
  }

  return (
    <Toolbar>
      <ToolbarSearch
        value={store.searchQuery}
        onChange={(val) => store.setSearchQuery(val)}
        placeholder={t('search')}
        dropdownItems={dropdownItems}
        dropdownLoading={store.isSearchingFiles}
        onDropdownSelect={handleDropdownSelect}
      />

      <ToolbarSpacer />
    </Toolbar>
  )
})

export default MusicToolbar
