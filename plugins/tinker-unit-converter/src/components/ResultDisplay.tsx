import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ResultDisplay() {
  const { t } = useTranslation()

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('copySuccess'))
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {store.allResults.map((item) => {
        const isSourceUnit = item.key === store.from
        return (
          <div
            key={item.key}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              isSourceUnit
                ? `${tw.primary.bg} text-white`
                : `${tw.bg.light.secondary} ${tw.bg.dark.secondary} hover:opacity-80`
            } ${tw.border.both} border`}
            onClick={() => handleCopy(item.value)}
          >
            <div className="flex justify-between items-center">
              <span
                className={`font-medium text-lg ${
                  isSourceUnit
                    ? 'text-white'
                    : `${tw.text.light.primary} ${tw.text.dark.primary}`
                }`}
              >
                {item.value}
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-sm ${
                    isSourceUnit
                      ? 'text-white opacity-90'
                      : `${tw.text.light.secondary} ${tw.text.dark.secondary}`
                  }`}
                >
                  {item.unit}
                </span>
                <span
                  className={`text-xs ${
                    isSourceUnit
                      ? 'text-white opacity-80'
                      : `${tw.text.light.secondary} ${tw.text.dark.secondary}`
                  }`}
                >
                  {t(item.unitKey)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
