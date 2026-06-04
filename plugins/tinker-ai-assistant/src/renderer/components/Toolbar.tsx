import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Eraser, FolderOpen } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  async function selectWorkingDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      store.setWorkingDir(result.filePaths[0])
    }
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={selectWorkingDir}
        title={store.workingDir}
        className={`font-mono max-w-[200px] flex items-center gap-1 ${tw.text.secondary}`}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} className="shrink-0" />
        <span className="truncate">
          {store.workingDir.split('/').filter(Boolean).pop() ??
            store.workingDir}
        </span>
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarButton
        title={t('clearMessages')}
        onClick={() => store.clearMessages()}
        disabled={!store.messages.length}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
