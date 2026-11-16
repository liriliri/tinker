import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FolderOpen,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import {
  Toolbar as ToolbarRoot,
  ToolbarButton,
  ToolbarColor,
  ToolbarLabel,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

interface ToolbarProps {
  onNew: () => void
  onOpen: () => void
}

export default observer(function Toolbar({ onNew, onOpen }: ToolbarProps) {
  const { t } = useTranslation()
  const hasProject = store.hasProject
  const canPlay = store.frameCount > 1

  return (
    <ToolbarRoot>
      <ToolbarButton onClick={onNew} title={t('newGif')}>
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton onClick={onOpen} title={t('openGif')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('background')}:`}</ToolbarLabel>
        <ToolbarColor
          value={store.backgroundColor}
          onChange={(e) => store.setBackgroundColor(e.target.value)}
          title={t('background')}
        />
      </div>

      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => store.selectFirst()}
        title={t('firstFrame')}
        disabled={!hasProject}
      >
        <SkipBack size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.selectPrev()}
        title={t('prevFrame')}
        disabled={!hasProject}
      >
        <ChevronLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.togglePlay()}
        title={store.isPlaying ? t('pause') : t('play')}
        disabled={!canPlay}
      >
        {store.isPlaying ? (
          <Pause size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Play size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.selectNext()}
        title={t('nextFrame')}
        disabled={!hasProject}
      >
        <ChevronRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.selectLast()}
        title={t('lastFrame')}
        disabled={!hasProject}
      >
        <SkipForward size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />
      <ToolbarTextButton
        variant={store.exporting ? 'secondary' : 'primary'}
        onClick={() => void store.exportGif()}
        disabled={!hasProject || store.exporting || store.loading}
      >
        {store.exporting ? t('exporting') : t('exportGif')}
      </ToolbarTextButton>
    </ToolbarRoot>
  )
})
