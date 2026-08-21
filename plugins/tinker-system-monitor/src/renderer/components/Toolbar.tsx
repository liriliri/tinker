import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Battery, Clock, Pause, PictureInPicture2, Play } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import { formatUptime } from '../lib/format'
import store from '../store'
import { toggleFloatWindow } from './FloatMonitor'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const battery = store.payload?.textMetrics.battery
  const uptime = store.payload?.textMetrics.uptime ?? 0

  return (
    <Toolbar>
      <ToolbarButton
        variant="toggle"
        active={store.paused}
        title={store.paused ? t('resume') : t('pause')}
        onClick={() => store.togglePaused()}
      >
        {store.paused ? (
          <Play size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Pause size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
      <ToolbarButton
        variant="toggle"
        active={store.floatOpen}
        onClick={toggleFloatWindow}
        title={t('float')}
      >
        <PictureInPicture2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      {uptime > 0 && (
        <div
          className={`flex items-center gap-1 px-2 text-xs ${tw.text.secondary}`}
        >
          <Clock size={TOOLBAR_ICON_SIZE} />
          <span className="tabular-nums">{formatUptime(t, uptime)}</span>
        </div>
      )}
      {battery?.hasBattery && (
        <div
          className={`flex items-center gap-1 px-2 text-xs ${tw.text.secondary}`}
        >
          <Battery size={TOOLBAR_ICON_SIZE} />
          <span className="tabular-nums">{battery.percent.toFixed(0)}%</span>
        </div>
      )}
    </Toolbar>
  )
})
