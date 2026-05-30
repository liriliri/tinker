import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function IncludeExcludePanel() {
  const { t } = useTranslation()

  const inputClass = `w-full px-2 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing} placeholder:${tw.text.tertiary} dark:placeholder:${tw.text.tertiary}`

  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <label className={`text-[11px] ${tw.text.tertiary}`}>
          {t('filesToInclude')}
        </label>
        <input
          type="text"
          value={store.includes}
          onChange={(e) => store.setIncludes(e.target.value)}
          placeholder={t('includesPlaceholder')}
          className={inputClass}
        />
      </div>
      <div className="space-y-0.5">
        <label className={`text-[11px] ${tw.text.tertiary}`}>
          {t('filesToExclude')}
        </label>
        <input
          type="text"
          value={store.excludes}
          onChange={(e) => store.setExcludes(e.target.value)}
          placeholder={t('excludesPlaceholder')}
          className={inputClass}
        />
      </div>
    </div>
  )
})
