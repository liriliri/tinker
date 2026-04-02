import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ArrowUp, FolderOpen } from 'lucide-react'
import fileSize from 'licia/fileSize'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const currentData = store.currentData

  const handleOpenDirectory = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      store.reset()
      store.openDirectory(result.filePaths[0])
    }
  }

  return (
    <ToolbarBase>
      <ToolbarButton onClick={handleOpenDirectory} title={t('openFolder')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.navigateBack()}
        disabled={!store.canGoBack}
        title={t('back')}
      >
        <ArrowLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.navigateForward()}
        disabled={!store.canGoForward}
        title={t('forward')}
      >
        <ArrowRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.navigateUp()}
        disabled={!store.canGoUp}
        title={t('up')}
      >
        <ArrowUp size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <div className="flex-1" />

      {store.view === 'chart' && currentData && (
        <span className={`text-xs ${tw.text.tertiary} mr-1 shrink-0`}>
          {fileSize(currentData.size)}
        </span>
      )}
    </ToolbarBase>
  )
})
