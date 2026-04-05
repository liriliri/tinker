import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const handleOpenFolder = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const [dirPath] = result.filePaths
    if (result.canceled || !dirPath) return

    store.reset()
    store.openDirectory(dirPath)
  }

  return (
    <ToolbarBase>
      <ToolbarButton onClick={handleOpenFolder} title={t('openFolder2')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      {store.view === 'result' && (
        <span className={`text-xs ${tw.text.secondary} mr-2`}>
          {t('duplicateGroups', { count: store.duplicateGroups.length })}
        </span>
      )}
    </ToolbarBase>
  )
})
