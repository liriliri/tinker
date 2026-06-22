import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { FolderOpen, FolderSearch, ListX, PanelRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  ToolbarSearchDropdownItem,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'
import { IMAGE_DIALOG_OPTIONS } from '../lib/util'
import store from '../store'

const PhotoToolbar = observer(function PhotoToolbar() {
  const { t } = useTranslation()

  const dropdownItems = useMemo<ToolbarSearchDropdownItem[]>(
    () =>
      store.fileSearchResults.map((result) => ({
        id: result.path,
        label: result.name,
        description: result.path,
      })),
    [store.fileSearchResults]
  )

  const handleImport = async () => {
    const result = await tinker.showOpenDialog(IMAGE_DIALOG_OPTIONS)
    if (!result.canceled && result.filePaths.length > 0) {
      await store.addFiles(result.filePaths)
    }
  }

  const handleDropdownSelect = (item: ToolbarSearchDropdownItem) => {
    store.addFromSearchResult(item.id)
  }

  const handleClearList = async () => {
    if (store.photos.length === 0) return

    const confirmed = await confirm({
      title: t('clearList'),
      message: t('clearListConfirm'),
      confirmText: t('clearList'),
    })
    if (!confirmed) return

    await store.clearAllPhotos()
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

      <ToolbarButton onClick={handleImport} title={t('import')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.showScanDialogView()}
        title={t('scanLocalPhotos')}
      >
        <FolderSearch size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleClearList}
        disabled={store.photos.length === 0 || store.isScanning}
        title={t('clearList')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <span className="text-xs opacity-60 px-2">
        {t('photoCount', { count: store.photos.length })}
      </span>

      {store.viewerOpen && (
        <ToolbarButton
          onClick={() => store.toggleInfoPanel()}
          title={t('toggleInfoPanel')}
        >
          <PanelRight size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      )}
    </Toolbar>
  )
})

export default PhotoToolbar
