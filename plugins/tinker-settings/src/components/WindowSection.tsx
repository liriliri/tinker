import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Checkbox from 'share/components/Checkbox'
import ShortcutInput from './ShortcutInput'
import store from '../store'
import Section, { SettingItem } from './Section'

export default observer(function WindowSection() {
  const { t } = useTranslation()

  return (
    <Section title={t('window')}>
      <SettingItem label={t('showShortcut')}>
        <ShortcutInput
          value={store.showShortcut}
          onChange={(v) => store.setShowShortcut(v)}
          placeholder={t('recordShortcut')}
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
