import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function StartupSection() {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className={`text-base font-semibold mb-2 ${tw.primary.text}`}>
        {t('startup')}
      </h2>
      <section
        className={`rounded-lg p-3 border ${tw.border} ${tw.bg.secondary}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className={`text-xs ${tw.text.secondary}`}>
              {t('openAtLogin')}
            </label>
            <Checkbox
              checked={store.openAtLogin}
              onChange={(v) => store.setOpenAtLogin(v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className={`text-xs ${tw.text.secondary}`}>
              {t('silentStart')}
            </label>
            <Checkbox
              checked={store.silentStart}
              onChange={(v) => store.setSilentStart(v)}
            />
          </div>
        </div>
      </section>
    </div>
  )
})
