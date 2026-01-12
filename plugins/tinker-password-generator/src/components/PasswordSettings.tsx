import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

interface PasswordSettingsProps {
  onInputChange: () => void
}

export default observer(function PasswordSettings({
  onInputChange,
}: PasswordSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label
          className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
        >
          {t('passwordLength')}{' '}
          <span
            className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
          >
            {t('lengthExample')}
          </span>
        </label>
        <input
          type="number"
          min="1"
          max="99"
          value={store.length}
          onChange={(e) => {
            store.setLength(Number(e.target.value))
            onInputChange()
          }}
          className={`w-full px-3 py-2 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
        />
      </div>
      <div>
        <label
          className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
        >
          {t('maxRepetition')}{' '}
          <span
            className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
          >
            {t('repetitionExample')}
          </span>
        </label>
        <input
          type="number"
          min="0"
          max="9"
          value={store.repeat}
          onChange={(e) => {
            store.setRepeat(Number(e.target.value))
            onInputChange()
          }}
          className={`w-full px-3 py-2 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
        />
      </div>
    </div>
  )
})
