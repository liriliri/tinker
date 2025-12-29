import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save } from 'lucide-react'
import store from '../store'
import {
  Toolbar as ToolbarContainer,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  return (
    <ToolbarContainer>
      <ToolbarButton onClick={() => store.openFile()} title={t('open')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.saveFile()}
        title={t('save')}
        disabled={!store.hasData || !store.hasUnsavedChanges}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      {store.currentFileName && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-2 whitespace-nowrap">
          {store.currentFileName}
        </div>
      )}
    </ToolbarContainer>
  )
})
