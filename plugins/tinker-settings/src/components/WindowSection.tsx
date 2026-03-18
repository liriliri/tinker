import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

const MAC_SHORTCUTS = ['Option+Space', 'Ctrl+Ctrl']
const WIN_SHORTCUTS = ['Alt+Space', 'Ctrl+Ctrl']

export default observer(function WindowSection() {
  const { t } = useTranslation()

  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const shortcutOptions = useMemo(
    () =>
      (isMac ? MAC_SHORTCUTS : WIN_SHORTCUTS).map((s) => ({
        label: s,
        value: s,
      })),
    [isMac]
  )

  return (
    <div>
      <h2 className={`text-base font-semibold mb-2 ${tw.primary.text}`}>
        {t('window')}
      </h2>
      <section
        className={`rounded-lg p-3 border ${tw.border} ${tw.bg.secondary}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className={`text-xs ${tw.text.secondary}`}>
              {t('showShortcut')}
            </label>
            <Select
              value={store.showShortcut}
              onChange={(v) => store.setShowShortcut(v)}
              options={shortcutOptions}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className={`text-xs ${tw.text.secondary}`}>
              {t('autoHide')}
            </label>
            <Checkbox
              checked={store.autoHide}
              onChange={(v) => store.setAutoHide(v)}
            />
          </div>
        </div>
      </section>
    </div>
  )
})
