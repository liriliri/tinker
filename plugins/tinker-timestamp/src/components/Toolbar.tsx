import { observer } from 'mobx-react-lite'
import { Clock, Copy, RotateCcw, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const copyCurrentTimestamp = async () => {
    await copyToClipboard(store.currentTimestampDisplay)
  }

  const resetData = () => {
    const now = new Date(store.currentTimestamp)
    store.setSelectedDate(now)
    store.setTimestampInput(store.currentTimestampDisplay)
  }

  const timezoneOptions = store.timezones.map((tz) => ({
    label: t(store.getTimezoneKey(tz)),
    value: tz,
  }))

  return (
    <Toolbar>
      {/* Unit Selection */}
      <ToolbarButton
        variant="toggle"
        active={store.timestampUnit === 'millisecond'}
        onClick={() => store.setTimestampUnit('millisecond')}
        className="px-2 py-1 text-xs"
        title={t('millisecond')}
      >
        {t('millisecond')}
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.timestampUnit === 'second'}
        onClick={() => store.setTimestampUnit('second')}
        className="px-2 py-1 text-xs"
        title={t('second')}
      >
        {t('second')}
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Timezone Selector */}
      <Select
        value={store.timezone}
        onChange={(value) => store.setTimezone(value)}
        options={timezoneOptions}
      />

      <ToolbarSeparator />

      {/* Current Timestamp Display */}
      <div
        className={`flex items-center gap-1 px-2 py-1 ${tw.bg.light.primary} ${tw.bg.dark.primary} rounded text-xs font-mono`}
      >
        <Clock size={12} className="text-gray-500 dark:text-gray-400" />
        <span>{store.currentTimestampDisplay}</span>
      </div>

      {/* Copy */}
      <ToolbarButton
        onClick={copyCurrentTimestamp}
        className={copied ? tw.primary.text : ''}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarSpacer />

      {/* Reset */}
      <ToolbarButton onClick={resetData} title={t('reload')}>
        <RotateCcw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
