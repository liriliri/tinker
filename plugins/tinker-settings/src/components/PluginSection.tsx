import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import Checkbox from 'share/components/Checkbox'
import store from '../store'
import Section, { SettingItem } from './Section'

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
      <Section title="NPM">
        <SettingItem label={t('registry')}>
          <TextInput
            value={store.npmRegistry}
            onChange={(e) => (store.npmRegistry = e.target.value)}
            onBlur={() => store.setNpmRegistry(store.npmRegistry)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                store.setNpmRegistry(store.npmRegistry)
              }
            }}
            placeholder="https://registry.npmmirror.com"
            className="flex-1 text-sm"
          />
        </SettingItem>
      </Section>
    </>
  )
})
