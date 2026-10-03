import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Prompt() {
  const { t } = useTranslation()

  return (
    <textarea
      value={store.prompt}
      onChange={(e) => store.setPrompt(e.target.value)}
      placeholder={t('promptPlaceholder')}
      className={`w-full flex-1 min-h-0 resize-none rounded border ${tw.border} ${tw.bg.primary} ${tw.text.primary} text-sm p-2 focus:outline-none ${tw.primary.focusBorder}`}
    />
  )
})
