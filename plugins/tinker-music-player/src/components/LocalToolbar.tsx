import { observer } from 'mobx-react-lite'
import { FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

const LocalToolbar = observer(() => {
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
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
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
