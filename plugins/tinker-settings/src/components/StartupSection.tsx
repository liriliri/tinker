import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import toNum from 'licia/toNum'
import Checkbox from 'share/components/Checkbox'
import TextInput from 'share/components/TextInput'
import store from '../store'
import Section, {
  SettingItem,
  SETTING_INPUT_CLASS,
  commitOnEnterOrBlur,
} from './Section'

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
          onChange={(e) => (store.httpPort = toNum(e.target.value) || 0)}
          {...commitOnEnterOrBlur(() => store.setHttpPort(store.httpPort))}
          disabled={!store.enableHttp}
          className={SETTING_INPUT_CLASS}
        />
      </SettingItem>
      <SettingItem label={t('httpUsername')}>
        <TextInput
          value={store.httpUsername}
          onChange={(e) => (store.httpUsername = e.target.value)}
          {...commitOnEnterOrBlur(() =>
            store.setHttpUsername(store.httpUsername)
          )}
          disabled={!store.enableHttp}
          className={SETTING_INPUT_CLASS}
        />
      </SettingItem>
      <SettingItem label={t('httpPassword')}>
        <TextInput
          type="password"
          value={store.httpPassword}
          onChange={(e) => (store.httpPassword = e.target.value)}
          {...commitOnEnterOrBlur(() =>
            store.setHttpPassword(store.httpPassword)
          )}
          disabled={!store.enableHttp}
          className={SETTING_INPUT_CLASS}
        />
      </SettingItem>
    </Section>
  )
})
