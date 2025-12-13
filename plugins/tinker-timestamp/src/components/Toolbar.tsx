import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Clock, Copy, RotateCcw, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const getUnitButtonClass = (isActive: boolean) =>
    `px-2 py-1 text-xs rounded transition-colors ${
      isActive
        ? 'bg-[#0fc25e] text-white hover:bg-[#0db054]'
        : 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
    }`

  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c]`

  const copyCurrentTimestamp = async () => {
    try {
      await navigator.clipboard.writeText(store.currentTimestampDisplay)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
      {/* Unit Selection */}
      <button
        onClick={() => store.setTimestampUnit('millisecond')}
        className={getUnitButtonClass(store.timestampUnit === 'millisecond')}
        title={t('millisecond')}
      >
        {t('millisecond')}
      </button>

      <button
        onClick={() => store.setTimestampUnit('second')}
        className={getUnitButtonClass(store.timestampUnit === 'second')}
        title={t('second')}
      >
        {t('second')}
      </button>

      <div className="h-5 w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      {/* Timezone Selector */}
      <Select
        value={store.timezone}
        onChange={(value) => store.setTimezone(value)}
        options={timezoneOptions}
      />

      <div className="h-5 w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      {/* Current Timestamp Display */}
      <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#1e1e1e] rounded text-xs font-mono">
        <Clock size={12} className="text-gray-500 dark:text-gray-400" />
        <span>{store.currentTimestampDisplay}</span>
      </div>

      {/* Copy */}
      <button
        onClick={copyCurrentTimestamp}
        className={
          copied
            ? `${baseButtonClass} text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c]`
            : actionButtonClass
        }
        title={t('copy')}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </button>

      <div className="flex-1" />

      {/* Reset */}
      <button
        onClick={resetData}
        className={actionButtonClass}
        title={t('reload')}
      >
        <RotateCcw size={iconSize} />
      </button>
    </div>
  )
})
