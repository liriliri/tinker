import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Download,
  Undo,
  Redo,
  Play,
  Pause,
  Square,
  Scissors,
  Trash2,
  VolumeX,
  Copy,
  ClipboardPaste,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BarChart3,
  Plus,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

interface Props {
  onOpen: () => void
  onExport: () => void
  onPlayPause: () => void
  onStop: () => void
  onTrim: () => void
  onDelete: () => void
  onSilence: () => void
  onCopy: () => void
  onPaste: () => void
  onFadeIn: () => void
  onFadeOut: () => void
  onReverse: () => void
  onNormalize: () => void
  onGain: () => void
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export default observer(function ToolbarComponent(props: Props) {
  const { t } = useTranslation()
  const hasAudio = store.hasAudio
  const hasSel = store.hasSelection
  const isPlaying = store.isPlaying

  return (
    <Toolbar>
      <ToolbarButton onClick={props.onOpen} title={t('open')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onExport}
        disabled={!hasAudio}
        title={t('export')}
      >
        <Download size={TOOLBAR_ICON_SIZE} />
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
        onClick={props.onTrim}
        disabled={!hasSel}
        title={t('trim')}
      >
        <Scissors size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onDelete}
        disabled={!hasSel}
        title={t('delete')}
      >
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onSilence}
        disabled={!hasSel}
        title={t('silence')}
      >
        <VolumeX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onCopy}
        disabled={!hasSel}
        title={t('copy')}
      >
        <Copy size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onPaste}
        disabled={!hasAudio || !store.clipboardBuffer}
        title={t('paste')}
      >
        <ClipboardPaste size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onFadeIn}
        disabled={!hasSel}
        title={t('fadeIn')}
      >
        <TrendingUp size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onFadeOut}
        disabled={!hasSel}
        title={t('fadeOut')}
      >
        <TrendingDown size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onReverse}
        disabled={!hasAudio}
        title={t('reverse')}
      >
        <ArrowLeftRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onNormalize}
        disabled={!hasAudio}
        title={t('normalize')}
      >
        <BarChart3 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onGain}
        disabled={!hasAudio}
        title={t('gain')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={props.onZoomIn}
        disabled={!hasAudio}
        title={t('zoomIn')}
      >
        <ZoomIn size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onZoomOut}
        disabled={!hasAudio}
        title={t('zoomOut')}
      >
        <ZoomOut size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={props.onZoomReset}
        disabled={!hasAudio}
        title={t('zoomReset')}
      >
        <RefreshCw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
