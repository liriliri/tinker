import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import store from '../store'

export default observer(function GeneratedPassword() {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <input
        type="text"
        value={store.generatedPassword}
        readOnly
        placeholder={t('generatedPassword')}
        className={`w-full px-3 py-2 pr-11 rounded border font-mono text-sm ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} select-all focus:outline-none ${tw.primary.focusBorder}`}
      />
      {store.generatedPassword && (
        <CopyButton
          variant="icon"
          text={store.generatedPassword}
          size={18}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded transition-colors`}
          iconClassName={`${tw.text.light.tertiary} ${tw.text.dark.tertiary}`}
          title={t('copyToClipboard')}
        />
      )}
    </div>
  )
})
