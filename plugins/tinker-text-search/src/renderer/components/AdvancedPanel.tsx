import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function AdvancedPanel() {
  const { t } = useTranslation()

  return (
    <div
      className={`absolute top-full right-0 mt-1 ${tw.bg.primary} border ${tw.border} rounded shadow-lg p-3 z-10 w-56 space-y-2`}
    >
      <Checkbox
        checked={store.multiline}
        onChange={(checked) => store.setMultiline(checked)}
      >
        <span className={tw.text.secondary}>{t('multiline')}</span>
      </Checkbox>
      <Checkbox
        checked={store.hidden}
        onChange={(checked) => store.setHidden(checked)}
      >
        <span className={tw.text.secondary}>{t('hidden')}</span>
      </Checkbox>
      <Checkbox
        checked={store.followSymlinks}
        onChange={(checked) => store.setFollowSymlinks(checked)}
      >
        <span className={tw.text.secondary}>{t('followSymlinks')}</span>
      </Checkbox>
      <div className="flex items-center gap-2 pt-1">
        <span className={`text-xs ${tw.text.secondary}`}>
          {t('maxResults')}
        </span>
        <input
          type="number"
          min={1}
          value={store.maxResults}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) store.setMaxResults(v)
          }}
          className={`flex-1 px-2 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`}
        />
      </div>
    </div>
  )
})
