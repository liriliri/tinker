import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save } from 'lucide-react'
import store from '../store'
import {
  Toolbar as ToolbarContainer,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'

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
    </ToolbarContainer>
  )
})
