import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
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
        <div className="flex items-center justify-between px-3 py-2 gap-3">
          <label className={`text-sm shrink-0 ${tw.text.primary}`}>
            {t('registry')}
          </label>
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
        </div>
      </Section>
    </>
  )
})
