import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Display() {
  const { t } = useTranslation()
  const displayText = store.hasError ? t('error') : store.displayValue

  return (
    <div className={`px-4 py-4 mb-8 rounded-xl ${tw.bg.both.tertiary}`}>
      <div
        className={`h-8 text-right text-xl md:text-2xl tracking-wide truncate ${tw.text.both.tertiary}`}
      >
        {store.preview}
      </div>
      <div
        className={`mt-2 text-right text-4xl md:text-5xl font-semibold tabular-nums break-all ${tw.text.both.primary}`}
      >
        {displayText}
      </div>
    </div>
  )
})
