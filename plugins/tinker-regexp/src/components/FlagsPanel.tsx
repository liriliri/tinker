import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const

export default observer(function FlagsPanel() {
  const { t } = useTranslation()

  return (
    <div
      className={`absolute top-12 right-0 ${tw.bg.light.primary} ${tw.bg.dark.primary} border ${tw.border.both} rounded shadow-lg p-3 z-10 min-w-[200px]`}
    >
      <div className="space-y-1">
        {FLAGS.map((flag) => (
          <Checkbox
            key={flag}
            checked={store.flags.includes(flag)}
            onChange={() => store.toggleFlag(flag)}
            className="p-1 rounded"
          >
            <span
              className={`${tw.text.light.secondary} ${tw.text.dark.secondary}`}
            >
              <strong>{flag}</strong> - {t(`flagLabels.${flag}`)}
            </span>
          </Checkbox>
        ))}
      </div>
    </div>
  )
})
