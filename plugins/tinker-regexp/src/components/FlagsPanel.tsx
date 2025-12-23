import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const

export default observer(function FlagsPanel() {
  const { t } = useTranslation()

  return (
    <div
      className={`absolute top-14 right-6 ${tw.bg.light.primary} ${tw.bg.dark.primary} border ${tw.border.both} rounded shadow-lg p-3 z-10 min-w-[200px]`}
    >
      <h3
        className={`text-sm font-semibold ${tw.text.light.primary} ${tw.text.dark.primary} mb-2`}
      >
        {t('flags')}
      </h3>
      <div className="space-y-1">
        {FLAGS.map((flag) => (
          <label
            key={flag}
            className={`flex items-center gap-2 cursor-pointer ${tw.hover.both} p-1 rounded`}
          >
            <input
              type="checkbox"
              checked={store.flags.includes(flag)}
              onChange={() => store.toggleFlag(flag)}
              className="w-4 h-4"
            />
            <span
              className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
            >
              <strong>{flag}</strong> - {t(`flagLabels.${flag}`)}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
})
