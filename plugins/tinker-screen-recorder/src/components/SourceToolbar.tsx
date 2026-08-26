import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Monitor, PanelTop, RotateCw } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function SourceToolbar() {
  const { t } = useTranslation()
  const disabled = store.recorderState !== 'idle'

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
      <ToolbarSeparator />
      <ToolbarButton
        title={t('refresh')}
        disabled={disabled || store.loadingSources}
        onClick={() => void store.loadSources()}
      >
        <RotateCw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <span className={`text-xs px-2 ${tw.text.tertiary}`}>
        {t(store.sourceType)}
      </span>
    </Toolbar>
  )
})
