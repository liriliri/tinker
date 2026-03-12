import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Undo,
  Redo,
  Play,
  Pause,
  Square,
  Plus,
  FoldVertical,
  UnfoldVertical,
  Save,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

interface Props {
  onOpen: () => void
  onExport: () => void
  onPlayPause: () => void
  onStop: () => void
  onGain: () => void
  onUndo: () => void
  onRedo: () => void
  onHeightIncrease: () => void
  onHeightDecrease: () => void
}

export default observer(function ToolbarComponent(props: Props) {
  const { t } = useTranslation()
  const hasAudio = store.hasAudio
  const isPlaying = store.isPlaying

  return (
    <Toolbar>
      <ToolbarButton onClick={props.onOpen} title={t('open')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onUndo}
        disabled={!store.canUndo}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onRedo}
        disabled={!store.canRedo}
        title={t('redo')}
      >
        <Redo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onPlayPause}
        disabled={!hasAudio}
        title={isPlaying ? t('pause') : t('play')}
      >
        {isPlaying ? (
          <Pause size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Play size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onStop}
        disabled={!hasAudio}
        title={t('stop')}
      >
        <Square size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onGain}
        disabled={!hasAudio}
        title={t('gain')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onHeightIncrease}
        disabled={!hasAudio}
        title={t('heightIncrease')}
      >
        <UnfoldVertical size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onHeightDecrease}
        disabled={!hasAudio}
        title={t('heightDecrease')}
      >
        <FoldVertical size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton
        onClick={props.onExport}
        disabled={!hasAudio}
        title={t('save')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
