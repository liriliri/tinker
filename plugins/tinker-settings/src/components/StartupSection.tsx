import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Checkbox from 'share/components/Checkbox'
import TextInput from 'share/components/TextInput'
import store from '../store'
import Section, { SettingItem } from './Section'

export default observer(function StartupSection() {
  const { t } = useTranslation()

  const handleEnableHttpChange = async (value: boolean) => {
    await store.setEnableHttp(value)
    toast(t('restartRequired'))
  }

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
      <SettingItem label={t('enableHttp')}>
        <Checkbox
          checked={store.enableHttp}
          onChange={handleEnableHttpChange}
        />
      </SettingItem>
      <SettingItem label={t('httpPort')}>
        <TextInput
          type="number"
          min={1}
          max={65535}
          value={store.httpPort}
          onChange={(e) => (store.httpPort = Number(e.target.value) || 0)}
          onBlur={() => {
            const port = Math.min(65535, Math.max(1, store.httpPort || 9223))
            store.setHttpPort(port)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const port = Math.min(65535, Math.max(1, store.httpPort || 9223))
              store.setHttpPort(port)
            }
          }}
          disabled={!store.enableHttp}
        />
      </SettingItem>
      <SettingItem label={t('httpUsername')}>
        <TextInput
          value={store.httpUsername}
          onChange={(e) => (store.httpUsername = e.target.value)}
          onBlur={() => store.setHttpUsername(store.httpUsername)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              store.setHttpUsername(store.httpUsername)
            }
          }}
          disabled={!store.enableHttp}
        />
      </SettingItem>
      <SettingItem label={t('httpPassword')}>
        <TextInput
          type="password"
          value={store.httpPassword}
          onChange={(e) => (store.httpPassword = e.target.value)}
          onBlur={() => store.setHttpPassword(store.httpPassword)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              store.setHttpPassword(store.httpPassword)
            }
          }}
          disabled={!store.enableHttp}
        />
      </SettingItem>
    </Section>
  )
})
