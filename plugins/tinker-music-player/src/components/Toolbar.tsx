import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

const MusicToolbar = observer(() => {
  const { t } = useTranslation()

  const handleImport = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio Files',
          extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma'],
        },
      ],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      store.addFiles(result.filePaths)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleImport} title={t('import')}>
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarSearch
        value={store.searchQuery}
        onChange={(val) => store.setSearchQuery(val)}
        placeholder={t('search')}
      />
    </Toolbar>
  )
})

export default MusicToolbar
