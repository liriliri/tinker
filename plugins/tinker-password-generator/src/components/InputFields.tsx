import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { Eye, EyeOff } from 'lucide-react'
import store from '../store'

interface InputFieldsProps {
  onInputChange: () => void
}

export default observer(function InputFields({
  onInputChange,
}: InputFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Service Name */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${tw.text.primary}`}>
          {t('serviceName')}{' '}
          <span className={`text-xs font-normal ${tw.text.secondary}`}>
            {t('serviceExample')}
          </span>
        </label>
        <TextInput
          type="text"
          value={store.service}
          onChange={(e) => {
            store.setService(e.target.value)
            onInputChange()
          }}
          className="transition-colors"
        />
      </div>

      {/* Passphrase */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${tw.text.primary}`}>
          {t('passphrase')}{' '}
          <span className={`text-xs font-normal ${tw.text.secondary}`}>
            {t('passphraseExample')}
          </span>
        </label>
        <div className="relative">
          <TextInput
            type={store.showPhrase ? 'text' : 'password'}
            value={store.phrase}
            onChange={(e) => {
              store.setPhrase(e.target.value)
              onInputChange()
            }}
            className="pr-11 transition-colors"
          />
          <button
            type="button"
            onClick={() => store.toggleShowPhrase()}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${tw.text.secondary} hover:opacity-70 transition-opacity`}
            title={store.showPhrase ? t('hidePassphrase') : t('showPassphrase')}
          >
            {store.showPhrase ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
})
