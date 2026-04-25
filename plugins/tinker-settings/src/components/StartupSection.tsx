import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Checkbox from 'share/components/Checkbox'
import store from '../store'
import Section, { SettingItem } from './Section'

export default observer(function StartupSection() {
  const { t } = useTranslation()

  return (
    <Section title={t('startup')}>
      <SettingItem label={t('openAtLogin')}>
        <Checkbox
          checked={store.openAtLogin}
          onChange={(v) => store.setOpenAtLogin(v)}
        />
      </SettingItem>
      <SettingItem label={t('silentStart')}>
        <Checkbox
          checked={store.silentStart}
          onChange={(v) => store.setSilentStart(v)}
        />
      </SettingItem>
    </Section>
  )
})
