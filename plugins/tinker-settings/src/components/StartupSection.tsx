import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function StartupSection() {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className={`text-sm font-semibold mb-2 px-1 ${tw.text.secondary}`}>
        {t('startup')}
      </h2>
      <section className={`rounded-lg border ${tw.border} ${tw.bg.secondary}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('openAtLogin')}
          </label>
          <Checkbox
            checked={store.openAtLogin}
            onChange={(v) => store.setOpenAtLogin(v)}
          />
        </div>
        <div className={`h-px ${tw.bg.border}`} />
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('silentStart')}
          </label>
          <Checkbox
            checked={store.silentStart}
            onChange={(v) => store.setSilentStart(v)}
          />
        </div>
      </section>
    </div>
  )
})
