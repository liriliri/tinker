import { useTranslation } from 'react-i18next'
import { Circle, Pause, Play, RotateCcw, Save, Square } from 'lucide-react'
import { tw } from 'share/theme'
import { mediaDurationFormat } from 'share/lib/util'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'

interface RecorderBarProps {
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onSave: () => void
  onReset: () => void
  canStart: boolean
  isRecording: boolean
  isPaused: boolean
  isPreview: boolean
  duration: number
}

export default function RecorderBar({
  onStart,
  onStop,
  onPause,
  onResume,
  onSave,
  onReset,
  canStart,
  isRecording,
  isPaused,
  isPreview,
  duration,
}: RecorderBarProps) {
  const { t } = useTranslation()

  return (
    <Toolbar>
      {!isPreview ? (
        <>
          {isRecording || isPaused ? (
            <>
              <ToolbarButton title={t('stop')} onClick={onStop}>
                <Square size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
              {isPaused ? (
                <ToolbarButton title={t('resume')} onClick={onResume}>
                  <Play size={TOOLBAR_ICON_SIZE} />
                </ToolbarButton>
              ) : (
                <ToolbarButton title={t('pause')} onClick={onPause}>
                  <Pause size={TOOLBAR_ICON_SIZE} />
                </ToolbarButton>
              )}
            </>
          ) : (
            <ToolbarButton
              title={t('start')}
              disabled={!canStart}
              onClick={onStart}
            >
              <Circle size={TOOLBAR_ICON_SIZE} className="text-red-500" />
            </ToolbarButton>
          )}
        </>
      ) : (
        <>
          <ToolbarButton title={t('save')} onClick={onSave}>
            <Save size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton title={t('newRecording')} onClick={onReset}>
            <RotateCcw size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </>
      )}
      <ToolbarSeparator />
      <ToolbarSpacer />
      <span
        className={`text-sm font-mono tabular-nums px-2 ${
          isRecording ? 'text-red-500' : tw.text.secondary
        }`}
      >
        {mediaDurationFormat(duration)}
      </span>
    </Toolbar>
  )
}
