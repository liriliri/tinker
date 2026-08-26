import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Monitor, PanelTop, RotateCw } from 'lucide-react'
import { tw } from 'share/theme'
import { mediaDurationFormat } from 'share/lib/util'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

interface ToolbarProps {
  onStart: () => void
  onStop: () => void
  onSave: () => void
  onReset: () => void
}

export default observer(function ToolbarComponent({
  onStart,
  onStop,
  onSave,
  onReset,
}: ToolbarProps) {
  const { t } = useTranslation()
  const disabled = store.recorderState !== 'idle'
  const { isRecording, isPreview, canRecord } = store
  const duration = store.currentRecordingDuration

  return (
    <Toolbar>
      <ToolbarButtonGroup>
        <ToolbarButton
          title={t('screen')}
          variant="toggle"
          active={store.sourceType === 'screen'}
          disabled={disabled}
          onClick={() => void store.switchSourceType('screen')}
        >
          <Monitor size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          title={t('window')}
          variant="toggle"
          active={store.sourceType === 'window'}
          disabled={disabled}
          onClick={() => void store.switchSourceType('window')}
        >
          <PanelTop size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>
      <ToolbarButton
        title={t('refresh')}
        disabled={disabled || store.loadingSources}
        onClick={() => void store.loadSources()}
      >
        <RotateCw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      {!isPreview && (
        <span
          className={`text-sm font-mono tabular-nums px-2 ${tw.text.secondary}`}
        >
          {mediaDurationFormat(duration)}
        </span>
      )}
      {isPreview && (
        <ToolbarTextButton variant="secondary" onClick={onReset}>
          {t('cancel')}
        </ToolbarTextButton>
      )}
      {isPreview ? (
        <ToolbarTextButton onClick={onSave}>{t('save')}</ToolbarTextButton>
      ) : isRecording ? (
        <ToolbarTextButton variant="secondary" onClick={onStop}>
          {t('stop')}
        </ToolbarTextButton>
      ) : (
        <ToolbarTextButton disabled={!canRecord} onClick={onStart}>
          {t('start')}
        </ToolbarTextButton>
      )}
    </Toolbar>
  )
})
