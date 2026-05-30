import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../../theme'
import TextInput from '../TextInput'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './namespace'

export default observer(function IncludeExcludePanel() {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { search } = useTextSearchContext()

  return (
    <div className="space-y-2">
      <TextInput
        type="text"
        value={search.includes}
        onChange={(e) => search.setIncludes(e.target.value)}
        placeholder={t('includesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
      <TextInput
        type="text"
        value={search.excludes}
        onChange={(e) => search.setExcludes(e.target.value)}
        placeholder={t('excludesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
    </div>
  )
})
