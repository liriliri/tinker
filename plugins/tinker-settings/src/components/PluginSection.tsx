import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import Checkbox from 'share/components/Checkbox'
import store from '../store'
import Section, {
  SettingItem,
  SETTING_INPUT_CLASS,
  commitOnEnterOrBlur,
} from './Section'

export default observer(function PluginSection() {
  const { t } = useTranslation()

  return (
    <>
      <Section title={t('general')}>
        <SettingItem label={t('showMarketplace')}>
          <Checkbox
            checked={store.showMarketplace}
            onChange={(v) => store.setShowMarketplace(v)}
          />
        </SettingItem>
      </Section>
      <Section title={t('npm')}>
        <SettingItem label={t('registry')}>
          <TextInput
            value={store.npmRegistry}
            onChange={(e) => (store.npmRegistry = e.target.value)}
            {...commitOnEnterOrBlur(() =>
              store.setNpmRegistry(store.npmRegistry)
            )}
            placeholder="https://registry.npmmirror.com"
            className={SETTING_INPUT_CLASS}
          />
        </SettingItem>
      </Section>
    </>
  )
})
