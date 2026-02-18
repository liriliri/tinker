import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from 'lucide-react'
import dateFormat from 'licia/dateFormat'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Converter() {
  const { t, i18n } = useTranslation()
  const [copiedDate, setCopiedDate] = useState(false)
  const [copiedTimestamp, setCopiedTimestamp] = useState(false)

  const handleDateTimeChange = (value: string) => {
    if (value) {
      const newDate = new Date(value)
      if (!isNaN(newDate.getTime())) {
        store.setSelectedDate(newDate)
      }
    }
  }

  const handleTimestampInput = (value: string) => {
    store.setTimestampInput(value)
  }

  const copyToClipboard = async (text: string, type: 'date' | 'timestamp') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'date') {
        setCopiedDate(true)
        setTimeout(() => setCopiedDate(false), 2000)
      } else {
        setCopiedTimestamp(true)
        setTimeout(() => setCopiedTimestamp(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const dateToTimestampResult = store.dateToTimestamp(store.selectedDate)
  const timestampToDateResult = store.timestampInput
    ? store.timestampToDate(store.timestampInput)
    : null

  // Get locale based on current language
  const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'

  // Extract city name from timezone label (e.g., "UTC+08:00 | Beijing" -> "Beijing")
  const currentTimezoneLabel = t(store.getTimezoneKey(store.timezone))
  const cityName = currentTimezoneLabel.split(' | ')[1] || currentTimezoneLabel

  return (
    <div className={`h-full flex flex-col ${tw.bg.secondary}`}>
      {/* Date to Timestamp */}
      <div className={`flex-1 border-b ${tw.border.both}`}>
        <div className="h-full flex flex-col p-6">
          <h2 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">
            {t('dateToTimestamp')} ({cityName}) {t('timestamp')}
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-auto">
            <TextInput
              type="datetime-local"
              step="1"
              value={dateFormat(store.selectedDate, 'yyyy-mm-dd"T"HH:MM:ss')}
              onChange={(e) => handleDateTimeChange(e.target.value)}
              className="text-sm"
            />
            <div
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-50 ${tw.bg.tertiary}`}
            >
              <div className="flex-1 text-gray-800 dark:text-gray-100 font-mono">
                {dateToTimestampResult}
              </div>
              <button
                onClick={() => copyToClipboard(dateToTimestampResult, 'date')}
                className={
                  copiedDate
                    ? `p-1 rounded ${tw.primary.text} ${tw.hover.both} transition-colors`
                    : `p-1 rounded ${tw.hover.both} transition-colors dark:text-gray-200`
                }
                title={t('copy')}
              >
                {copiedDate ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp to Date */}
      <div className="flex-1">
        <div className="h-full flex flex-col p-6">
          <h2 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">
            {t('timestampToDate')} ({cityName}) {t('date')}
          </h2>
          <div className="flex-1 flex flex-col gap-3">
            <TextInput
              type="text"
              value={store.timestampInput}
              onChange={(e) => handleTimestampInput(e.target.value)}
              placeholder={t('enterTimestamp')}
              className="text-sm font-mono"
            />
            <div
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-50 ${tw.bg.tertiary}`}
            >
              <div className="flex-1 text-gray-800 dark:text-gray-100">
                {timestampToDateResult
                  ? timestampToDateResult.toLocaleString(locale, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })
                  : '-'}
              </div>
              <button
                onClick={() =>
                  timestampToDateResult &&
                  copyToClipboard(
                    timestampToDateResult.toLocaleString(locale, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    }),
                    'timestamp'
                  )
                }
                disabled={!timestampToDateResult}
                className={
                  copiedTimestamp
                    ? `p-1 rounded ${tw.primary.text} ${tw.hover.both} transition-colors disabled:opacity-30 disabled:cursor-not-allowed`
                    : `p-1 rounded ${tw.hover.both} transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-200`
                }
                title={t('copy')}
              >
                {copiedTimestamp ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
