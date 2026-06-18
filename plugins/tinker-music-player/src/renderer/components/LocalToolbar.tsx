import { observer } from 'mobx-react-lite'
import { FolderOpen, FolderSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import { AUDIO_DIALOG_OPTIONS } from '../lib/util'

const LocalToolbar = observer(() => {
  const { t } = useTranslation()

  const handleImport = async () => {
    const result = await tinker.showOpenDialog(AUDIO_DIALOG_OPTIONS)
    if (!result.canceled && result.filePaths.length > 0) {
      await store.addFiles(result.filePaths)
      const added = store.tracks.find((t) => t.path === result.filePaths[0])
      if (added) {
        const index = store.tracks.indexOf(added)
        store.playTrack(index)
      }
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleImport} title={t('import')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.showScanDialogView()}
        title={t('scanLocalMusic')}
      >
        <FolderSearch size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarSearch
        value={store.listFilter}
        onChange={(val) => store.setListFilter(val)}
        placeholder={t('filter')}
      />
    </Toolbar>
  )
})

export default LocalToolbar
