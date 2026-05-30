import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import store from '../store'

export default observer(function IncludeExcludePanel() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <TextInput
        type="text"
        value={store.includes}
        onChange={(e) => store.setIncludes(e.target.value)}
        placeholder={t('includesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
      <TextInput
        type="text"
        value={store.excludes}
        onChange={(e) => store.setExcludes(e.target.value)}
        placeholder={t('excludesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
    </div>
  )
})
