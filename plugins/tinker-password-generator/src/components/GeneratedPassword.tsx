import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import CopyButton from 'share/components/CopyButton'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function GeneratedPassword() {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <TextInput
        type="text"
        value={store.generatedPassword}
        readOnly
        placeholder={t('generatedPassword')}
        className="pr-11 font-mono text-sm select-all"
      />
      {store.generatedPassword && (
        <CopyButton
          variant="icon"
          text={store.generatedPassword}
          size={18}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded transition-colors`}
          iconClassName={`${tw.text.tertiary}`}
          title={t('copyToClipboard')}
        />
      )}
    </div>
  )
})
