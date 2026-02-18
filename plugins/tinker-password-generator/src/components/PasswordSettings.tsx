import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
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
        <label className={`block text-sm mb-2 font-medium ${tw.text.primary}`}>
          {t('passwordLength')}{' '}
          <span className={`text-xs font-normal ${tw.text.secondary}`}>
            {t('lengthExample')}
          </span>
        </label>
        <TextInput
          type="number"
          min="1"
          max="99"
          value={store.length}
          onChange={(e) => {
            store.setLength(Number(e.target.value))
            onInputChange()
          }}
          className="transition-colors"
        />
      </div>
      <div>
        <label className={`block text-sm mb-2 font-medium ${tw.text.primary}`}>
          {t('maxRepetition')}{' '}
          <span className={`text-xs font-normal ${tw.text.secondary}`}>
            {t('repetitionExample')}
          </span>
        </label>
        <TextInput
          type="number"
          min="0"
          max="9"
          value={store.repeat}
          onChange={(e) => {
            store.setRepeat(Number(e.target.value))
            onInputChange()
          }}
          className="transition-colors"
        />
      </div>
    </div>
  )
})
