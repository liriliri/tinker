import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const handleOpenDirectory = async () => {
    await store.openDirectoryPicker(true)
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

      {store.view === 'chart' && (
        <ToolbarButton onClick={() => store.rescan()} title={t('rescan')}>
          <RefreshCw size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      )}
    </ToolbarBase>
  )
})
