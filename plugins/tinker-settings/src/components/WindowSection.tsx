import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import store from '../store'
import Section, { SettingItem } from './Section'

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
    <Section title={t('window')}>
      <SettingItem label={t('showShortcut')}>
        <Select
          value={store.showShortcut}
          onChange={(v) => store.setShowShortcut(v)}
          options={shortcutOptions}
        />
      </SettingItem>
      <SettingItem label={t('autoHide')}>
        <Checkbox
          checked={store.autoHide}
          onChange={(v) => store.setAutoHide(v)}
        />
      </SettingItem>
      <SettingItem label={t('searchLocalApps')}>
        <Checkbox
          checked={store.searchLocalApps}
          onChange={async (v) => {
            await store.setSearchLocalApps(v)
            toast(t('restartRequired'))
          }}
        />
      </SettingItem>
    </Section>
  )
})
