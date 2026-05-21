import { observer } from 'mobx-react-lite'
import { Music, PictureInPicture2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSearch,
  ToolbarSearchDropdownItem,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { openPopupWindow } from 'share/lib/popupWindow'
import store from '../store'
import MiniMode from './MiniMode'

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

  const handleMiniMode = () => {
    openPopupWindow(
      {
        width: 360,
        height: 72,
        minWidth: 280,
        minHeight: 72,
        transparent: true,
        resizable: false,
      },
      (_popup, onClose) => <MiniMode onClose={onClose} />
    )
  }

  return (
    <Toolbar>
      <ToolbarSearch
        value={store.searchQuery}
        onChange={(val) => store.setSearchQuery(val)}
        placeholder={t('search')}
        dropdownItems={dropdownItems.length > 0 ? dropdownItems : undefined}
        onDropdownSelect={handleDropdownSelect}
      />

      <ToolbarSpacer />

      <ToolbarButton onClick={handleMiniMode} title={t('miniMode')}>
        <PictureInPicture2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})

export default MusicToolbar
