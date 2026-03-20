import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

const MAC_SHORTCUTS = ['Option+Space', 'Ctrl+Ctrl']
const WIN_SHORTCUTS = ['Alt+Space', 'Ctrl+Ctrl']
const IS_MAC = navigator.platform.toUpperCase().includes('MAC')

export default observer(function WindowSection() {
  const { t } = useTranslation()

  const shortcutOptions = useMemo(
    () =>
      (IS_MAC ? MAC_SHORTCUTS : WIN_SHORTCUTS).map((s) => ({
        label: s,
        value: s,
      })),
    [IS_MAC]
  )

  return (
    <div>
      <h2 className={`text-sm font-semibold mb-2 px-1 ${tw.text.secondary}`}>
        {t('window')}
      </h2>
      <section className={`rounded-lg border ${tw.border} ${tw.bg.secondary}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('showShortcut')}
          </label>
          <Select
            value={store.showShortcut}
            onChange={(v) => store.setShowShortcut(v)}
            options={shortcutOptions}
          />
        </div>
        <div className={`h-px ${tw.bg.border}`} />
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('autoHide')}
          </label>
          <Checkbox
            checked={store.autoHide}
            onChange={(v) => store.setAutoHide(v)}
          />
        </div>
      </section>
    </div>
  )
})
