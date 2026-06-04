import { useTranslation } from 'react-i18next'
import { tw } from '../../theme'
import TextInput from '../TextInput'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './i18n'

export default function IncludeExcludePanel() {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { includes, excludes, onIncludesChange, onExcludesChange } =
    useTextSearchContext()

  return (
    <div className="space-y-2">
      <TextInput
        type="text"
        value={includes}
        onChange={(e) => onIncludesChange(e.target.value)}
        placeholder={t('includesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
      <TextInput
        type="text"
        value={excludes}
        onChange={(e) => onExcludesChange(e.target.value)}
        placeholder={t('excludesPlaceholder')}
        className={`focus:ring-2 ${tw.primary.focusRing}`}
      />
    </div>
  )
}
