import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from 'lucide-react'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from 'date-fns/locale'
import store from '../store'

const Converter = observer(() => {
  const { t } = useTranslation()
  const [copiedDate, setCopiedDate] = useState(false)
  const [copiedTimestamp, setCopiedTimestamp] = useState(false)

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

  const theme = createTheme({
    palette: {
      mode: store.isDark ? 'dark' : 'light',
      primary: {
        main: '#0fc25e',
      },
      background: {
        paper: store.isDark ? '#374151' : '#ffffff',
        default: store.isDark ? '#2d2d2d' : '#ffffff',
      },
      text: {
        primary: store.isDark ? '#e5e7eb' : '#374151',
      },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: store.isDark ? '#4a4a4a' : '#d1d5db',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0fc25e',
            },
          },
          notchedOutline: {
            borderColor: store.isDark ? '#4a4a4a' : '#d1d5db',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: store.isDark ? '#9ca3af' : '#6b7280',
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
        <div className="h-full flex flex-col">
          {/* Date to Timestamp */}
          <div className="flex-1 border-b border-[#e0e0e0] dark:border-[#4a4a4a]">
            <div className="h-full flex flex-col p-6">
              <h2 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">
                {t('dateToTimestamp')}
              </h2>
              <div className="flex-1 flex flex-col gap-3">
                <DateTimePicker
                  value={store.selectedDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      store.setSelectedDate(newValue)
                    }
                  }}
                  ampm={false}
                  format="yyyy-MM-dd HH:mm:ss"
                  slotProps={{
                    textField: {
                      size: 'small',
                      placeholder: t('selectDate'),
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem',
                          backgroundColor: store.isDark ? '#2d2d2d' : 'white',
                        },
                      },
                    },
                  }}
                />
                <div className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-50 dark:bg-[#252526]">
                  <div className="flex-1 text-gray-800 dark:text-gray-100 font-mono">
                    {dateToTimestampResult}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(dateToTimestampResult, 'date')
                    }
                    className={
                      copiedDate
                        ? 'p-1 rounded text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors'
                        : 'p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors dark:text-gray-200'
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
                {t('timestampToDate')}
              </h2>
              <div className="flex-1 flex flex-col gap-3">
                <input
                  type="text"
                  value={store.timestampInput}
                  onChange={(e) => handleTimestampInput(e.target.value)}
                  placeholder={t('enterTimestamp')}
                  className="px-3 py-2 text-sm rounded bg-white dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 font-mono border border-gray-300 dark:border-[#4a4a4a] focus:outline-none focus:border-[#0fc25e] dark:focus:border-[#0fc25e]"
                />
                <div className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-50 dark:bg-[#252526]">
                  <div className="flex-1 text-gray-800 dark:text-gray-100">
                    {timestampToDateResult
                      ? timestampToDateResult.toLocaleString('zh-CN', {
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
                        timestampToDateResult.toLocaleString('zh-CN', {
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
                        ? 'p-1 rounded text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                        : 'p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-200'
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
      </LocalizationProvider>
    </ThemeProvider>
  )
})

export default Converter
